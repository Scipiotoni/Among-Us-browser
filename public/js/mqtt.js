// Timers that keep running in background tabs (browsers slow normal timers down to once a
// minute there), plus a tiny MQTT 3.1.1 client over WebSocket. The client is a plain-JS port of
// the one in Casino-simulator (src/net/mqtt.ts): connect with a last will, subscribe, publish
// (QoS 0, optionally retained), keep-alive pings and automatic reconnects.
const BgTimer = (() => {
  const fns = new Map();
  let worker = null, next = 1;
  try {
    const src = 'const t={};onmessage=(e)=>{const d=e.data;if(d.ms)t[d.id]=setInterval(()=>postMessage(d.id),d.ms);else{clearInterval(t[d.id]);delete t[d.id];}};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = (e) => { const f = fns.get(e.data); if (f) f(); };
  } catch (e) { worker = null; }
  return {
    // Calls fn every ms milliseconds; returns a function that stops it.
    every(ms, fn) {
      if (!worker) { const iv = setInterval(fn, ms); return () => clearInterval(iv); }
      const id = next++;
      fns.set(id, fn);
      worker.postMessage({ id, ms });
      return () => { fns.delete(id); worker.postMessage({ id }); };
    },
  };
})();

class MqttClient {
  constructor(opts) {
    this.opts = opts;
    this.ws = null;
    this.buf = new Uint8Array(0);
    this.subs = [];
    this.nextId = 1;
    this.stopPing = null;
    this.retryMs = 1000;
    this.closed = false;
    this.connected = false;
    this.onMessage = null;
    this.onConnect = null;
    this.onClose = null;
  }

  static str(s) {
    const b = new TextEncoder().encode(s);
    const out = new Uint8Array(b.length + 2);
    out[0] = b.length >> 8;
    out[1] = b.length & 255;
    out.set(b, 2);
    return out;
  }

  static packet(type, ...parts) {
    let len = parts.reduce((a, p) => a + p.length, 0);
    const head = [type];
    do {
      let d = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) d |= 128;
      head.push(d);
    } while (len > 0);
    const total = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(head.length + total);
    out.set(head, 0);
    let o = head.length;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  connect() {
    if (this.closed) return;
    let ws;
    try { ws = new WebSocket(this.opts.url, ['mqtt']); } catch (e) { this.scheduleReconnect(); return; }
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      const will = this.opts.will;
      let flags = 0x02; // clean session
      const payload = [MqttClient.str(this.opts.clientId)];
      if (will) {
        flags |= 0x04 | (will.retain ? 0x20 : 0);
        payload.push(MqttClient.str(will.topic), MqttClient.str(will.payload));
      }
      const ka = this.opts.keepAlive || 30;
      const vh = new Uint8Array([0, 4, 77, 81, 84, 84, 4, flags, ka >> 8, ka & 255]);
      ws.send(MqttClient.packet(0x10, vh, ...payload));
    };
    ws.onmessage = (e) => this.onData(new Uint8Array(e.data));
    ws.onclose = () => {
      const was = this.connected;
      this.connected = false;
      if (this.stopPing) { this.stopPing(); this.stopPing = null; }
      if (was && this.onClose) this.onClose();
      this.scheduleReconnect();
    };
    ws.onerror = () => ws.close();
  }

  scheduleReconnect() {
    if (this.closed) return;
    setTimeout(() => this.connect(), this.retryMs);
    this.retryMs = Math.min(30000, this.retryMs * 2);
  }

  subscribe(filter) {
    if (!this.subs.includes(filter)) this.subs.push(filter);
    if (this.connected) this.sendSubscribe(filter);
  }

  unsubscribe(filter) {
    this.subs = this.subs.filter((s) => s !== filter);
    if (!this.connected) return;
    const id = (this.nextId++ & 0xffff) || 1;
    this.ws.send(MqttClient.packet(0xa2, new Uint8Array([id >> 8, id & 255]), MqttClient.str(filter)));
  }

  sendSubscribe(filter) {
    const id = (this.nextId++ & 0xffff) || 1;
    this.ws.send(MqttClient.packet(0x82, new Uint8Array([id >> 8, id & 255]), MqttClient.str(filter), new Uint8Array([0])));
  }

  publish(topic, payload, retain = false) {
    if (!this.connected || !this.ws) return false;
    this.ws.send(MqttClient.packet(0x30 | (retain ? 1 : 0), MqttClient.str(topic), new TextEncoder().encode(payload)));
    return true;
  }

  close() {
    this.closed = true;
    try { this.ws && this.ws.send(new Uint8Array([0xe0, 0])); } catch (e) { /* already gone */ }
    if (this.ws) this.ws.close();
  }

  onData(chunk) {
    const merged = new Uint8Array(this.buf.length + chunk.length);
    merged.set(this.buf, 0);
    merged.set(chunk, this.buf.length);
    this.buf = merged;
    for (;;) {
      if (this.buf.length < 2) return;
      let mult = 1, len = 0, i = 1, byte;
      do {
        if (i >= this.buf.length) return;
        byte = this.buf[i++];
        len += (byte & 127) * mult;
        mult *= 128;
      } while (byte & 128);
      if (this.buf.length < i + len) return;
      const type = this.buf[0] >> 4, flags = this.buf[0] & 15;
      const body = this.buf.subarray(i, i + len);
      this.buf = this.buf.slice(i + len);
      this.handle(type, flags, body);
    }
  }

  handle(type, flags, body) {
    if (type === 2) { // CONNACK
      if (body[1] !== 0) { this.ws.close(); return; }
      this.connected = true;
      this.retryMs = 1000;
      for (const s of this.subs) this.sendSubscribe(s);
      const ka = (this.opts.keepAlive || 30) * 1000 * 0.6;
      this.stopPing = BgTimer.every(ka, () => { try { this.ws.send(new Uint8Array([0xc0, 0])); } catch (e) { /* closing */ } });
      if (this.onConnect) this.onConnect();
    } else if (type === 3) { // PUBLISH
      const tl = (body[0] << 8) | body[1];
      const topic = new TextDecoder().decode(body.subarray(2, 2 + tl));
      let o = 2 + tl;
      if ((flags >> 1) & 3) o += 2;
      if (this.onMessage) this.onMessage(topic, new TextDecoder().decode(body.subarray(o)));
    }
  }
}

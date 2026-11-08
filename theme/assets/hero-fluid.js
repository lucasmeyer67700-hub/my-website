/*
  Rose ink for the home page opening: a small fluid simulation (WebGL) in
  which the pointer, or a finger, leaves trails of colour that swirl and fade
  on a white page. Written for this theme, no library.

  Method: the usual "stable fluids" steps on the GPU (advection, curl and
  vorticity, divergence, pressure, gradient subtraction). The colour is
  stored as ink absorption and shown as exp(-ink), so trails mix like
  watercolour on paper and never go darker than a set rose.

  Falls back to a still rose wash (CSS) without WebGL, without the needed
  texture formats, or for visitors who ask for less motion. Pauses off
  screen and in background tabs.
*/
(() => {
  class HeroFluid extends HTMLElement {
    connectedCallback() {
      if (this.started) return;
      this.started = true;
      this.canvas = this.querySelector('canvas');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!this.canvas || reduce) return this.fallback();
      try {
        if (!this.init()) return this.fallback();
      } catch (error) {
        return this.fallback();
      }
      this.classList.add('is-live');
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
      this.abort?.abort();
    }

    fallback() {
      this.classList.add('is-still');
    }

    /* ------------------------------------------------------------ setup */

    init() {
      const params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = this.canvas.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!gl) gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
      if (!gl) return false;
      this.gl = gl;

      let halfFloat;
      let supportLinear;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinear = gl.getExtension('OES_texture_float_linear') || true;
        halfFloat = gl.HALF_FLOAT;
      } else {
        const ext = gl.getExtension('OES_texture_half_float');
        supportLinear = gl.getExtension('OES_texture_half_float_linear');
        if (!ext) return false;
        halfFloat = ext.HALF_FLOAT_OES;
      }
      if (!supportLinear) return false;

      const rgba = isWebGL2 ? this.format(gl.RGBA16F, gl.RGBA, halfFloat) : this.format(gl.RGBA, gl.RGBA, halfFloat);
      const rg = isWebGL2 ? this.format(gl.RG16F, gl.RG, halfFloat) || rgba : rgba;
      const r = isWebGL2 ? this.format(gl.R16F, gl.RED, halfFloat) || rgba : rgba;
      if (!rgba) return false;
      this.formats = { rgba, rg, r, type: halfFloat };

      const small = window.matchMedia('(max-width: 749px)').matches;
      this.config = {
        simRes: small ? 96 : 128,
        dyeRes: small ? 512 : 1024,
        densityDissipation: 1.7,
        velocityDissipation: 0.35,
        pressure: 0.8,
        pressureIterations: 18,
        curl: 22,
        splatRadius: small ? 0.26 : 0.18,
        splatForce: 5200,
      };

      this.programs = this.compile();
      this.quad();
      this.resize();
      this.listen();
      this.palette = this.readPalette();
      this.colorIndex = 0;
      this.lastInput = 0;
      this.lastAmbient = 0;
      this.time = performance.now();
      this.visible = true;

      // Arrival: a burst of colour from the centre of the page (theme
      // setting), otherwise a first breath of ink.
      if (this.hasAttribute('data-explode')) this.explode();
      else this.burst(3);

      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.loop();
      });
      this.observer.observe(this);
      this.loop();
      return true;
    }

    format(internal, format, type) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(fbo);
      return ok ? { internal, format } : null;
    }

    /** Ink colours: absorptions that turn white paper into each rose. */
    readPalette() {
      const style = getComputedStyle(this);
      const list = (style.getPropertyValue('--fluid-colors') || '#e8a0b0,#f2c3cc,#f1b29e,#d98da6,#c9727e')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      return list.map((hex) => {
        const n = parseInt(hex.replace('#', ''), 16);
        const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(v / 255, 0.02));
        return rgb.map((v) => -Math.log(v));
      });
    }

    compile() {
      const gl = this.gl;
      const shader = (type, source) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const vertex = shader(
        gl.VERTEX_SHADER,
        `precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv, vL, vR, vT, vB;
        uniform vec2 texelSize;
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }`
      );
      const head = `precision highp float; precision highp sampler2D; varying vec2 vUv, vL, vR, vT, vB;`;
      const sources = {
        clear: `${head} uniform sampler2D uTexture; uniform float value;
          void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`,
        splat: `${head} uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
          void main () {
            vec2 p = vUv - point.xy; p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
          }`,
        advection: `${head} uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation;
          void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
          }`,
        divergence: `${head} uniform sampler2D uVelocity;
          void main () {
            float L = texture2D(uVelocity, vL).x, R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
            if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
            gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
          }`,
        curl: `${head} uniform sampler2D uVelocity;
          void main () {
            float L = texture2D(uVelocity, vL).y, R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
            gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
          }`,
        vorticity: `${head} uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
          void main () {
            float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x, C = texture2D(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C; force.y *= -1.0;
            vec2 velocity = texture2D(uVelocity, vUv).xy + force * dt;
            gl_FragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
          }`,
        pressure: `${head} uniform sampler2D uPressure, uDivergence;
          void main () {
            float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
            float divergence = texture2D(uDivergence, vUv).x;
            gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
          }`,
        gradient: `${head} uniform sampler2D uPressure, uVelocity;
          void main () {
            float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
          }`,
        display: `${head} uniform sampler2D uTexture; uniform vec3 paper, floorColor;
          void main () {
            vec3 ink = max(texture2D(uTexture, vUv).rgb, 0.0);
            vec3 c = paper * exp(-ink);
            gl_FragColor = vec4(max(c, floorColor), 1.0);
          }`,
      };
      const programs = {};
      for (const [name, source] of Object.entries(sources)) {
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, source));
        gl.bindAttribLocation(program, 0, 'aPosition');
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
          const name2 = gl.getActiveUniform(program, i).name;
          uniforms[name2] = gl.getUniformLocation(program, name2);
        }
        programs[name] = { program, uniforms };
      }
      return programs;
    }

    quad() {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
    }

    blit(target) {
      const gl = this.gl;
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    target(width, height, format) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, format.internal, width, height, 0, format.format, this.formats.type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width,
        height,
        texel: [1 / width, 1 / height],
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    double(width, height, format) {
      let a = this.target(width, height, format);
      let b = this.target(width, height, format);
      return {
        width,
        height,
        texel: a.texel,
        get read() {
          return a;
        },
        get write() {
          return b;
        },
        swap() {
          [a, b] = [b, a];
        },
      };
    }

    resolution(base) {
      const gl = this.gl;
      let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      const min = Math.round(base);
      const max = Math.round(base * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(this.canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(this.canvas.clientHeight * ratio));
      if (this.canvas.width === width && this.canvas.height === height && this.dye) return;
      this.canvas.width = width;
      this.canvas.height = height;
      const sim = this.resolution(this.config.simRes);
      const dye = this.resolution(this.config.dyeRes);
      const { rgba, rg, r } = this.formats;
      this.dye = this.double(dye.width, dye.height, rgba);
      this.velocity = this.double(sim.width, sim.height, rg);
      this.divergence = this.target(sim.width, sim.height, r);
      this.curlTarget = this.target(sim.width, sim.height, r);
      this.pressure = this.double(sim.width, sim.height, r);
    }

    /* ------------------------------------------------------------ input */

    listen() {
      this.abort = new AbortController();
      const { signal } = this.abort;
      this.pointer = { x: 0, y: 0, moved: false, down: false, dx: 0, dy: 0 };
      const move = (event) => {
        const box = this.canvas.getBoundingClientRect();
        if (!box.width) return;
        const x = (event.clientX - box.left) / box.width;
        const y = 1 - (event.clientY - box.top) / box.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        const p = this.pointer;
        if (!p.down) {
          p.x = x;
          p.y = y;
          p.down = true;
          return;
        }
        p.dx = (x - p.x) * (box.width / box.height);
        p.dy = y - p.y;
        p.x = x;
        p.y = y;
        p.moved = Math.abs(p.dx) + Math.abs(p.dy) > 0;
        this.lastInput = performance.now();
      };
      this.addEventListener('pointermove', move, { passive: true, signal });
      this.addEventListener('pointerdown', move, { passive: true, signal });
      this.addEventListener('pointerleave', () => (this.pointer.down = false), { signal });
      this.addEventListener('touchmove', (e) => e.touches[0] && move(e.touches[0]), { passive: true, signal });
      window.addEventListener('resize', () => (this.needsResize = true), { signal });
      document.addEventListener('visibilitychange', () => !document.hidden && this.loop(), { signal });
    }

    nextColor(strength) {
      this.colorIndex = (this.colorIndex + 0.035) % this.palette.length;
      const a = this.palette[Math.floor(this.colorIndex)];
      const b = this.palette[(Math.floor(this.colorIndex) + 1) % this.palette.length];
      const t = this.colorIndex % 1;
      return a.map((v, i) => (v * (1 - t) + b[i] * t) * strength);
    }

    splat(x, y, dx, dy, color) {
      const gl = this.gl;
      const { splat } = this.programs;
      gl.useProgram(splat.program);
      const aspect = this.canvas.width / this.canvas.height;
      const radius = (this.config.splatRadius / 100) * (aspect > 1 ? aspect : 1);
      gl.uniform1i(splat.uniforms.uTarget, this.velocity.read.attach(0));
      gl.uniform1f(splat.uniforms.aspectRatio, aspect);
      gl.uniform2f(splat.uniforms.point, x, y);
      gl.uniform3f(splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(splat.uniforms.radius, radius);
      this.blit(this.velocity.write);
      this.velocity.swap();
      gl.uniform1i(splat.uniforms.uTarget, this.dye.read.attach(0));
      gl.uniform3f(splat.uniforms.color, color[0], color[1], color[2]);
      this.blit(this.dye.write);
      this.dye.swap();
    }

    /**
     * Colour bursting out from one point, in three quick waves: every rose
     * of the palette shoots outwards, then curls and settles.
     */
    explode() {
      const cx = 0.62;
      const cy = 0.55;
      const waves = [
        { delay: 120, count: 14, speed: 3600, strength: 0.75, spread: 0.02 },
        { delay: 360, count: 10, speed: 2600, strength: 0.55, spread: 0.06 },
        { delay: 640, count: 8, speed: 1700, strength: 0.4, spread: 0.1 },
      ];
      for (const wave of waves) {
        setTimeout(() => {
          if (!this.gl) return;
          for (let i = 0; i < wave.count; i++) {
            const angle = (i / wave.count) * Math.PI * 2 + Math.random() * 0.5;
            const reach = wave.spread * (0.5 + Math.random());
            const x = cx + Math.cos(angle) * reach;
            const y = cy + Math.sin(angle) * reach * (this.canvas.width / this.canvas.height);
            const speed = wave.speed * (0.75 + Math.random() * 0.5);
            this.colorIndex = (i / wave.count) * this.palette.length;
            this.splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.nextColor(wave.strength));
          }
        }, wave.delay);
      }
      // Keep the drifting ribbon away until the burst has settled.
      this.lastInput = performance.now() + 2500;
    }

    burst(count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.splat(0.35 + Math.random() * 0.5, 0.3 + Math.random() * 0.5, Math.cos(angle) * 900, Math.sin(angle) * 900, this.nextColor(0.45));
      }
    }

    /* ------------------------------------------------------------ loop */

    loop() {
      if (this.running) return;
      this.running = true;
      const tick = (now) => {
        if (!this.visible || document.hidden) {
          this.running = false;
          return;
        }
        const dt = Math.min((now - this.time) / 1000, 0.016666);
        this.time = now;
        if (this.needsResize) {
          this.needsResize = false;
          this.resize();
        }
        this.input(now);
        this.step(dt);
        this.render();
        this.frame = requestAnimationFrame(tick);
      };
      this.time = performance.now();
      this.frame = requestAnimationFrame(tick);
    }

    input(now) {
      const p = this.pointer;
      if (p.moved) {
        p.moved = false;
        this.splat(p.x, p.y, p.dx * this.config.splatForce, p.dy * this.config.splatForce, this.nextColor(0.2));
      }
      // Nobody moving: a slow ribbon of ink drifts by on its own.
      if (now - this.lastInput > 2600 && now - this.lastAmbient > 90) {
        this.lastAmbient = now;
        const t = now / 1000;
        const x = 0.62 + Math.cos(t * 0.37) * 0.26;
        const y = 0.5 + Math.sin(t * 0.53) * 0.3;
        const dx = -Math.sin(t * 0.37) * 0.26 * 0.37;
        const dy = Math.cos(t * 0.53) * 0.3 * 0.53;
        this.splat(x, y, dx * 900, dy * 900, this.nextColor(0.07));
      }
    }

    step(dt) {
      const gl = this.gl;
      const P = this.programs;
      const v = this.velocity;
      gl.disable(gl.BLEND);

      gl.useProgram(P.curl.program);
      gl.uniform2f(P.curl.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.curl.uniforms.uVelocity, v.read.attach(0));
      this.blit(this.curlTarget);

      gl.useProgram(P.vorticity.program);
      gl.uniform2f(P.vorticity.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.vorticity.uniforms.uVelocity, v.read.attach(0));
      gl.uniform1i(P.vorticity.uniforms.uCurl, this.curlTarget.attach(1));
      gl.uniform1f(P.vorticity.uniforms.curl, this.config.curl);
      gl.uniform1f(P.vorticity.uniforms.dt, dt);
      this.blit(v.write);
      v.swap();

      gl.useProgram(P.divergence.program);
      gl.uniform2f(P.divergence.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.divergence.uniforms.uVelocity, v.read.attach(0));
      this.blit(this.divergence);

      gl.useProgram(P.clear.program);
      gl.uniform1i(P.clear.uniforms.uTexture, this.pressure.read.attach(0));
      gl.uniform1f(P.clear.uniforms.value, this.config.pressure);
      this.blit(this.pressure.write);
      this.pressure.swap();

      gl.useProgram(P.pressure.program);
      gl.uniform2f(P.pressure.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.pressure.uniforms.uDivergence, this.divergence.attach(0));
      for (let i = 0; i < this.config.pressureIterations; i++) {
        gl.uniform1i(P.pressure.uniforms.uPressure, this.pressure.read.attach(1));
        this.blit(this.pressure.write);
        this.pressure.swap();
      }

      gl.useProgram(P.gradient.program);
      gl.uniform2f(P.gradient.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.gradient.uniforms.uPressure, this.pressure.read.attach(0));
      gl.uniform1i(P.gradient.uniforms.uVelocity, v.read.attach(1));
      this.blit(v.write);
      v.swap();

      gl.useProgram(P.advection.program);
      gl.uniform2f(P.advection.uniforms.texelSize, ...v.texel);
      const id = v.read.attach(0);
      gl.uniform1i(P.advection.uniforms.uVelocity, id);
      gl.uniform1i(P.advection.uniforms.uSource, id);
      gl.uniform1f(P.advection.uniforms.dt, dt);
      gl.uniform1f(P.advection.uniforms.dissipation, this.config.velocityDissipation);
      this.blit(v.write);
      v.swap();

      gl.uniform1i(P.advection.uniforms.uVelocity, v.read.attach(0));
      gl.uniform1i(P.advection.uniforms.uSource, this.dye.read.attach(1));
      gl.uniform1f(P.advection.uniforms.dissipation, this.config.densityDissipation);
      this.blit(this.dye.write);
      this.dye.swap();
    }

    render() {
      const gl = this.gl;
      const { display } = this.programs;
      gl.useProgram(display.program);
      gl.uniform2f(display.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
      gl.uniform1i(display.uniforms.uTexture, this.dye.read.attach(0));
      gl.uniform3f(display.uniforms.paper, 1, 1, 1);
      // Never darker than a soft rose, so dark text stays easy to read on top.
      gl.uniform3f(display.uniforms.floorColor, 0.86, 0.64, 0.69);
      this.blit(null);
    }
  }

  if (!customElements.get('hero-fluid')) customElements.define('hero-fluid', HeroFluid);
})();

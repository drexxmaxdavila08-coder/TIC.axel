(function () {
  var drawerBtn = document.getElementById("drawerBtn");
  var drawerPanel = document.getElementById("drawerPanel");
  if (drawerBtn && drawerPanel) {
    drawerBtn.addEventListener("click", function () {
      drawerPanel.classList.toggle("open");
    });
  }

  var langBtn = document.getElementById("langBtn");
  var langDrop = document.getElementById("langDrop");
  var langLabel = document.getElementById("langLabel");
  if (langBtn && langDrop && langLabel) {
    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      langDrop.classList.toggle("open");
    });
    langDrop.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        langLabel.textContent = b.getAttribute("data-lang");
        langDrop.classList.remove("open");
      });
    });
  }

  var megaBtn = document.getElementById("megaBtn");
  var megaPanel = document.getElementById("megaPanel");
  if (megaBtn && megaPanel) {
    megaBtn.addEventListener("click", function () {
      var isOpen = megaPanel.classList.toggle("open");
      megaBtn.classList.toggle("active", isOpen);
    });
  }

  var slides = document.querySelectorAll(".slide");
  var slideBtns = document.querySelectorAll(".slide-btn");
  slideBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = Number(btn.getAttribute("data-idx"));
      slides.forEach(function (s, i) {
        s.classList.toggle("active", i === idx);
      });
      slideBtns.forEach(function (b, i) {
        b.classList.toggle("active", i === idx);
      });
    });
  });

  var tabBtns = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll("#senales .panel");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-panel");
      tabBtns.forEach(function (b) { b.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  var board = document.getElementById("netBoard");
  var svg = document.getElementById("netLinks");
  var netMsg = document.getElementById("netMsg");
  var netDevs = document.getElementById("netDevs");
  var netCables = document.getElementById("netCables");
  var netState = document.getElementById("netState");
  var netReset = document.getElementById("netReset");

  if (board && svg) {
    var NS = "http://www.w3.org/2000/svg";
    var devs = {};
    var links = [];
    var temp = null;
    var working = false;
    var t = 0;

    var pkt = document.createElementNS(NS, "circle");
    pkt.setAttribute("r", "6");
    pkt.setAttribute("fill", "#ffffff");
    pkt.style.display = "none";

    board.querySelectorAll(".net-dev").forEach(function (el) {
      var type = el.getAttribute("data-type");
      devs[type] = {
        el: el,
        fx0: Number(el.getAttribute("data-x")),
        fy0: Number(el.getAttribute("data-y")),
        fx: Number(el.getAttribute("data-x")),
        fy: Number(el.getAttribute("data-y"))
      };
    });

    function key(a, b) { return [a, b].sort().join("-"); }
    function has(a, b) { return links.indexOf(key(a, b)) !== -1; }

    function place(d) {
      var maxX = board.clientWidth - d.el.offsetWidth;
      var maxY = board.clientHeight - d.el.offsetHeight;
      d.el.style.left = Math.round(d.fx * maxX) + "px";
      d.el.style.top = Math.round(d.fy * maxY) + "px";
    }

    function center(d) {
      return {
        x: d.el.offsetLeft + d.el.offsetWidth / 2,
        y: d.el.offsetTop + d.el.offsetHeight / 2
      };
    }

    function addLine(a, b, color, dashed, onClick) {
      var ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", a.x);
      ln.setAttribute("y1", a.y);
      ln.setAttribute("x2", b.x);
      ln.setAttribute("y2", b.y);
      ln.setAttribute("stroke", color);
      ln.setAttribute("stroke-width", "3");
      ln.setAttribute("stroke-linecap", "round");
      if (dashed) ln.setAttribute("stroke-dasharray", "6 6");
      if (onClick) {
        ln.style.pointerEvents = "stroke";
        ln.style.cursor = "pointer";
        ln.addEventListener("click", onClick);
      }
      svg.appendChild(ln);
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      links.forEach(function (k) {
        var parts = k.split("-");
        addLine(center(devs[parts[0]]), center(devs[parts[1]]),
          working ? "#22c55e" : "#94a3b8", false, function () {
            links.splice(links.indexOf(k), 1);
            update();
          });
      });
      if (temp) {
        addLine(center(devs[temp.from]), { x: temp.x, y: temp.y }, "#ff4d57", true, null);
      }
      svg.appendChild(pkt);
    }

    function setMsg(text, cls) {
      netMsg.textContent = text;
      netMsg.className = "net-msg" + (cls ? " " + cls : "");
    }

    function update() {
      var pcSw = has("pc", "switch");
      var swRt = has("switch", "router");
      var direct = has("pc", "router");
      var good = (pcSw ? 1 : 0) + (swRt ? 1 : 0);
      working = pcSw && swRt && links.length === 2;

      netCables.textContent = "Cables: " + good + "/2";
      netState.textContent = "Red: " + (working ? "Funcionando" : "Sin conexión");

      if (working) {
        setMsg("¡La red funciona! El PC llega al Router a través del Switch (ping exitoso).", "ok");
      } else if (direct) {
        setMsg("Conexión incorrecta: el PC no va directo al Router. Quita ese cable y usa el Switch.", "warn");
      } else if (links.length > good) {
        setMsg("Hay un cable que no corresponde a esta red. Haz clic en él para quitarlo.", "warn");
      } else if (pcSw && !swRt) {
        setMsg("Bien. Ahora conecta el Switch al Router.", "");
      } else if (!pcSw && swRt) {
        setMsg("Bien. Ahora conecta el PC al Switch.", "");
      } else {
        setMsg("Conecta el PC al Switch y el Switch al Router.", "");
      }
      pkt.style.display = working ? "block" : "none";
      render();
    }

    function bindDevice(type) {
      var d = devs[type];
      var port = d.el.querySelector(".net-port");
      var offX = 0;
      var offY = 0;
      var moving = false;

      d.el.addEventListener("pointerdown", function (e) {
        moving = true;
        var r = board.getBoundingClientRect();
        offX = e.clientX - r.left - d.el.offsetLeft;
        offY = e.clientY - r.top - d.el.offsetTop;
        d.el.setPointerCapture(e.pointerId);
        d.el.classList.add("dragging");
      });
      d.el.addEventListener("pointermove", function (e) {
        if (!moving) return;
        var r = board.getBoundingClientRect();
        var maxX = board.clientWidth - d.el.offsetWidth;
        var maxY = board.clientHeight - d.el.offsetHeight;
        var x = Math.min(Math.max(e.clientX - r.left - offX, 0), maxX);
        var y = Math.min(Math.max(e.clientY - r.top - offY, 0), maxY);
        d.fx = maxX > 0 ? x / maxX : 0;
        d.fy = maxY > 0 ? y / maxY : 0;
        place(d);
        render();
      });
      function stopMove() {
        moving = false;
        d.el.classList.remove("dragging");
      }
      d.el.addEventListener("pointerup", stopMove);
      d.el.addEventListener("pointercancel", stopMove);

      port.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var r = board.getBoundingClientRect();
        temp = { from: type, x: e.clientX - r.left, y: e.clientY - r.top };
        port.setPointerCapture(e.pointerId);
        render();
      });
      port.addEventListener("pointermove", function (e) {
        if (!temp) return;
        var r = board.getBoundingClientRect();
        temp.x = e.clientX - r.left;
        temp.y = e.clientY - r.top;
        render();
      });
      port.addEventListener("pointerup", function (e) {
        if (!temp) return;
        var target = document.elementFromPoint(e.clientX, e.clientY);
        var devEl = target && target.closest ? target.closest(".net-dev") : null;
        if (devEl) {
          var other = devEl.getAttribute("data-type");
          if (other !== type && !has(type, other)) links.push(key(type, other));
        }
        temp = null;
        update();
      });
      port.addEventListener("pointercancel", function () {
        temp = null;
        render();
      });
    }

    Object.keys(devs).forEach(function (type) {
      place(devs[type]);
      bindDevice(type);
    });

    function layoutAll() {
      Object.keys(devs).forEach(function (type) { place(devs[type]); });
      render();
    }
    window.addEventListener("resize", layoutAll);

    if (netReset) {
      netReset.addEventListener("click", function () {
        links = [];
        temp = null;
        Object.keys(devs).forEach(function (type) {
          devs[type].fx = devs[type].fx0;
          devs[type].fy = devs[type].fy0;
          place(devs[type]);
        });
        update();
      });
    }

    function lerp(a, b, k) {
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }

    function animate() {
      if (working) {
        t += 0.012;
        var p = t % 2;
        var s = p <= 1 ? p : 2 - p;
        var a = center(devs.pc);
        var b = center(devs.switch);
        var c = center(devs.router);
        var pos = s < 0.5 ? lerp(a, b, s * 2) : lerp(b, c, (s - 0.5) * 2);
        pkt.setAttribute("cx", pos.x);
        pkt.setAttribute("cy", pos.y);
      }
      requestAnimationFrame(animate);
    }

    update();
    animate();
  }

  // Calculadora de subredes
  var ipInput = document.getElementById("ipInput");
  var cidrInput = document.getElementById("cidrInput");
  if (ipInput && cidrInput) {
    var cidrOut = document.getElementById("cidrOut");
    var calcErr = document.getElementById("calcErr");
    var rIds = { net: "rNet", mask: "rMask", bc: "rBc", first: "rFirst", last: "rLast", hosts: "rHosts" };

    function toInt(ip) {
      var parts = ip.trim().split(".");
      if (parts.length !== 4) return null;
      var n = 0;
      for (var i = 0; i < 4; i++) {
        if (!/^\d{1,3}$/.test(parts[i]) || Number(parts[i]) > 255) return null;
        n = n * 256 + Number(parts[i]);
      }
      return n;
    }
    function toIp(n) {
      return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    }
    function setR(k, v) { document.getElementById(rIds[k]).textContent = v; }

    function calcSubnet() {
      var c = Number(cidrInput.value);
      cidrOut.textContent = c;
      var ip = toInt(ipInput.value);
      if (ip === null) {
        Object.keys(rIds).forEach(function (k) { setR(k, "-"); });
        calcErr.textContent = "Introduce una IPv4 válida (por ejemplo 192.168.10.130).";
        calcErr.className = "net-msg warn";
        return;
      }
      var mask = (0xFFFFFFFF << (32 - c)) >>> 0;
      var net = (ip & mask) >>> 0;
      var bc = (net | (~mask >>> 0)) >>> 0;
      var hosts = Math.pow(2, 32 - c) - 2;
      setR("net", toIp(net) + "/" + c);
      setR("mask", toIp(mask));
      setR("bc", toIp(bc));
      setR("first", toIp(net + 1));
      setR("last", toIp(bc - 1));
      setR("hosts", hosts.toLocaleString("es-PE"));
      calcErr.textContent = "Cálculo correcto. Un host puede ir de " + toIp(net + 1) + " a " + toIp(bc - 1) + ".";
      calcErr.className = "net-msg ok";
    }
    ipInput.addEventListener("input", calcSubnet);
    cidrInput.addEventListener("input", calcSubnet);
    calcSubnet();
  }

  // Quiz
  var quizQ = document.getElementById("quizQ");
  if (quizQ) {
    var questions = [
      { q: "¿Qué dispositivo conecta redes distintas y enruta paquetes IP?", o: ["Switch", "Router", "Hub", "Repetidor"], a: 1, e: "El router trabaja en la capa 3 y decide la mejor ruta entre redes." },
      { q: "¿En qué capa del modelo OSI trabaja un switch?", o: ["Capa 1 (Física)", "Capa 3 (Red)", "Capa 2 (Enlace de datos)", "Capa 7 (Aplicación)"], a: 2, e: "El switch reenvía tramas usando direcciones MAC, en la capa 2." },
      { q: "¿Qué comando muestra el estado resumido de las interfaces?", o: ["show ip interface brief", "show vlan id", "ping interface", "enable secret"], a: 0, e: "show ip interface brief lista cada interfaz con su IP y su estado." },
      { q: "¿Cuántos hosts útiles tiene una red /26?", o: ["64", "30", "126", "62"], a: 3, e: "2^6 = 64 direcciones, menos la de red y la de broadcast, quedan 62." },
      { q: "¿Qué modo de Packet Tracer permite ver cada paquete paso a paso?", o: ["Realtime", "Simulación", "Actividad", "Consola"], a: 1, e: "El modo Simulación muestra el recorrido y la PDU de cada paquete." }
    ];
    var qIdx = 0;
    var qScore = 0;
    var qDone = false;
    var quizOpts = document.getElementById("quizOpts");
    var quizFb = document.getElementById("quizFb");
    var quizNext = document.getElementById("quizNext");
    var quizScore = document.getElementById("quizScore");
    var quizReset = document.getElementById("quizReset");

    function showQ() {
      var item = questions[qIdx];
      qDone = false;
      quizQ.textContent = (qIdx + 1) + ". " + item.q;
      quizOpts.innerHTML = "";
      quizFb.textContent = "";
      quizNext.style.display = "none";
      item.o.forEach(function (txt, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "quiz-opt";
        b.textContent = txt;
        b.addEventListener("click", function () { answer(i, b); });
        quizOpts.appendChild(b);
      });
    }

    function answer(i, btn) {
      if (qDone) return;
      qDone = true;
      var item = questions[qIdx];
      var btns = quizOpts.querySelectorAll(".quiz-opt");
      btns[item.a].classList.add("right");
      if (i === item.a) {
        qScore++;
        quizFb.textContent = "¡Correcto! " + item.e;
      } else {
        btn.classList.add("wrong");
        quizFb.textContent = "Incorrecto. " + item.e;
      }
      quizScore.textContent = "Puntaje: " + qScore + "/" + questions.length;
      quizNext.textContent = qIdx === questions.length - 1 ? "Ver resultado" : "Siguiente";
      quizNext.style.display = "inline-block";
    }

    function finish() {
      var msg = qScore >= 4 ? "¡Excelente! Dominas lo básico de redes." : (qScore >= 3 ? "Bien. Repasa los comandos y el modelo OSI." : "Sigue practicando: revisa las secciones anteriores y vuelve a intentarlo.");
      quizQ.textContent = "Resultado final: " + qScore + " de " + questions.length;
      quizOpts.innerHTML = "";
      quizFb.textContent = msg;
      quizNext.style.display = "none";
      quizScore.className = "net-msg " + (qScore >= 3 ? "ok" : "warn");
    }

    quizNext.addEventListener("click", function () {
      if (qIdx === questions.length - 1) { finish(); return; }
      qIdx++;
      showQ();
    });
    quizReset.addEventListener("click", function () {
      qIdx = 0;
      qScore = 0;
      quizScore.textContent = "Puntaje: 0/" + questions.length;
      quizScore.className = "net-msg";
      showQ();
    });
    showQ();
  }

  // Formulario de comentarios (demostración, sin servidor)
  var feedbackForm = document.getElementById("feedbackForm");
  if (feedbackForm) {
    var formMsg = document.getElementById("formMsg");
    feedbackForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = document.getElementById("fNombre").value.trim();
      formMsg.textContent = "¡Gracias, " + nombre + "! Tu comentario fue registrado (demostración: esta página no envía datos a ningún servidor).";
      formMsg.className = "net-msg ok";
      feedbackForm.reset();
    });
  }

  document.addEventListener("click", function () {
    if (langDrop) langDrop.classList.remove("open");
  });
})();

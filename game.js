/* ============================================================
   ALA 4 // QUARENTENA
   Jogo de zumbi top-down: tiro, troca de arma, recarga,
   sistema de nível/exp, spawns de zumbi.
   ============================================================ */

(() => {
  "use strict";

  // ----------------------------------------------------------
  // SETUP DO CANVAS
  // ----------------------------------------------------------
  const canvas = document.getElementById("canvas-jogo");
  const ctx = canvas.getContext("2d");

  function ajustarTamanhoCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  ajustarTamanhoCanvas();
  window.addEventListener("resize", ajustarTamanhoCanvas);

  // ----------------------------------------------------------
  // ELEMENTOS DE UI
  // ----------------------------------------------------------
  const telaInicio   = document.getElementById("tela-inicio");
  const telaMorte    = document.getElementById("tela-morte");
  const hud          = document.getElementById("hud");
  const btnIniciar   = document.getElementById("btn-iniciar");
  const btnReiniciar = document.getElementById("btn-reiniciar");

  const elBarraVida   = document.getElementById("barra-vida");
  const elTextoVida    = document.getElementById("texto-vida");
  const elTextoVidaMax  = document.getElementById("texto-vida-max");

  const elBarraExp    = document.getElementById("barra-exp");
  const elTextoExp     = document.getElementById("texto-exp");
  const elTextoExpMax   = document.getElementById("texto-exp-max");
  const elTextoNivel    = document.getElementById("texto-nivel");
  const elLinhaEcg      = document.getElementById("linha-ecg");

  const elNomeArma     = document.getElementById("texto-nome-arma");
  const elSeringaLiq    = document.getElementById("seringa-liquido");
  const elTextoMunicao   = document.getElementById("texto-municao");
  const elTextoMunicaoMax = document.getElementById("texto-municao-max");
  const elAvisoRecarga  = document.getElementById("aviso-recarga");

  const elTextoAbates   = document.getElementById("texto-abates");
  const elAvisoNivel    = document.getElementById("aviso-nivel");
  const elNivelFinal    = document.getElementById("nivel-final");
  const elAbatesFinal   = document.getElementById("abates-final");
  const elOndaFinal     = document.getElementById("onda-final");

  const elBarraPoder     = document.getElementById("barra-poder");
  const elStatusPoder    = document.getElementById("texto-status-poder");
  const elNomePoder      = document.getElementById("texto-nome-poder");

  const elTextoOnda         = document.getElementById("texto-onda");
  const elTextoOndaRestantes = document.getElementById("texto-onda-restantes");
  const elStatusOnda        = document.getElementById("texto-status-onda");
  const elAvisoOnda         = document.getElementById("aviso-onda");

  const elSlotAtualNumero = document.getElementById("slot-atual-numero");
  const elSlotAtualNome   = document.getElementById("slot-atual-nome");
  const elSlotAnterior    = document.getElementById("slot-anterior");
  const elSlotProximo     = document.getElementById("slot-proximo");

  // --- Navegação do menu principal ---
  const painelMenuPrincipal = document.getElementById("painel-menu-principal");
  const painelSkin    = document.getElementById("painel-skin");
  const painelArmas   = document.getElementById("painel-armas");
  const painelPoderes = document.getElementById("painel-poderes");

  const btnAbrirSkin    = document.getElementById("btn-abrir-skin");
  const btnAbrirArmas   = document.getElementById("btn-abrir-armas");
  const btnAbrirPoderes = document.getElementById("btn-abrir-poderes");

  const elResumoSkin  = document.getElementById("resumo-skin");
  const elResumoArmas = document.getElementById("resumo-armas");
  const elResumoPoder = document.getElementById("resumo-poder");

  const elGradeSkins   = document.getElementById("grade-skins");
  const elGradeArmas   = document.getElementById("grade-armas");
  const elGradePoderes = document.getElementById("grade-poderes");
  const elContadorArmasSelecionadas = document.getElementById("contador-armas-selecionadas");

  // (inventário antigo de 4 slots removido — ver barra-inventario no HUD)

  // ----------------------------------------------------------
  // DEFINIÇÃO DAS ARMAS (24 no total)
  // cada arma: dano, cadência (ms entre tiros), municao max,
  // tempo de recarga, velocidade do projétil, dispersão, nível mínimo
  // organizadas em categorias: pistolas, submetralhadoras, fuzis,
  // shotguns e especiais — desbloqueadas progressivamente por nível
  // ----------------------------------------------------------
  const DEFINICAO_ARMAS = {
    // --- PISTOLAS ---
    glock: {
      nome: "Glock", categoria: "Pistola", nivelMinimo: 1,
      dano: 18, cadenciaMs: 280, municaoMax: 12, tempoRecargaMs: 900,
      velocidadeProjetil: 11, dispersao: 0.03, corProjetil: "#e8d56a",
      automatica: false, projeteisPorTiro: 1
    },
    magnum: {
      nome: "Magnum .44", categoria: "Pistola", nivelMinimo: 2,
      dano: 48, cadenciaMs: 520, municaoMax: 6, tempoRecargaMs: 1300,
      velocidadeProjetil: 13, dispersao: 0.015, corProjetil: "#ffe08a",
      automatica: false, projeteisPorTiro: 1
    },
    pistola_silenciada: {
      nome: "Pistola Silenciada", categoria: "Pistola", nivelMinimo: 3,
      dano: 22, cadenciaMs: 240, municaoMax: 15, tempoRecargaMs: 850,
      velocidadeProjetil: 12, dispersao: 0.02, corProjetil: "#bcd4c4",
      automatica: false, projeteisPorTiro: 1
    },
    desert_eagle: {
      nome: "Desert Eagle", categoria: "Pistola", nivelMinimo: 5,
      dano: 38, cadenciaMs: 320, municaoMax: 9, tempoRecargaMs: 1100,
      velocidadeProjetil: 14, dispersao: 0.025, corProjetil: "#f0c93a",
      automatica: false, projeteisPorTiro: 1
    },

    // --- SUBMETRALHADORAS ---
    metralhadora: {
      nome: "Metralhadora", categoria: "SMG", nivelMinimo: 2,
      dano: 9, cadenciaMs: 95, municaoMax: 30, tempoRecargaMs: 1600,
      velocidadeProjetil: 13, dispersao: 0.09, corProjetil: "#9fd6ff",
      automatica: true, projeteisPorTiro: 1
    },
    uzi: {
      nome: "Uzi", categoria: "SMG", nivelMinimo: 4,
      dano: 8, cadenciaMs: 70, municaoMax: 32, tempoRecargaMs: 1400,
      velocidadeProjetil: 13, dispersao: 0.11, corProjetil: "#a7e8ff",
      automatica: true, projeteisPorTiro: 1
    },
    mp5: {
      nome: "MP5", categoria: "SMG", nivelMinimo: 6,
      dano: 11, cadenciaMs: 85, municaoMax: 30, tempoRecargaMs: 1450,
      velocidadeProjetil: 14, dispersao: 0.07, corProjetil: "#8ad6ff",
      automatica: true, projeteisPorTiro: 1
    },
    p90: {
      nome: "P90", categoria: "SMG", nivelMinimo: 8,
      dano: 10, cadenciaMs: 65, municaoMax: 50, tempoRecargaMs: 1700,
      velocidadeProjetil: 14, dispersao: 0.08, corProjetil: "#7fcfff",
      automatica: true, projeteisPorTiro: 1
    },
    skorpion: {
      nome: "Skorpion", categoria: "SMG", nivelMinimo: 10,
      dano: 7, cadenciaMs: 55, municaoMax: 20, tempoRecargaMs: 1100,
      velocidadeProjetil: 13, dispersao: 0.13, corProjetil: "#b3e8ff",
      automatica: true, projeteisPorTiro: 1
    },

    // --- FUZIS / METRALHADORAS PESADAS ---
    thompson: {
      nome: "Thompson", categoria: "Fuzil", nivelMinimo: 3,
      dano: 14, cadenciaMs: 130, municaoMax: 20, tempoRecargaMs: 1400,
      velocidadeProjetil: 12, dispersao: 0.06, corProjetil: "#ffb066",
      automatica: true, projeteisPorTiro: 1
    },
    chicago: {
      nome: "Chicago Typewriter", categoria: "Fuzil", nivelMinimo: 4,
      dano: 22, cadenciaMs: 90, municaoMax: 50, tempoRecargaMs: 2200,
      velocidadeProjetil: 14, dispersao: 0.07, corProjetil: "#ff6b6b",
      automatica: true, projeteisPorTiro: 1
    },
    ak47: {
      nome: "AK-47", categoria: "Fuzil", nivelMinimo: 5,
      dano: 24, cadenciaMs: 110, municaoMax: 30, tempoRecargaMs: 1900,
      velocidadeProjetil: 15, dispersao: 0.06, corProjetil: "#ff9d4d",
      automatica: true, projeteisPorTiro: 1
    },
    m4a1: {
      nome: "M4A1", categoria: "Fuzil", nivelMinimo: 7,
      dano: 20, cadenciaMs: 100, municaoMax: 30, tempoRecargaMs: 1700,
      velocidadeProjetil: 16, dispersao: 0.045, corProjetil: "#ffd17a",
      automatica: true, projeteisPorTiro: 1
    },
    famas: {
      nome: "FAMAS", categoria: "Fuzil", nivelMinimo: 9,
      dano: 19, cadenciaMs: 95, municaoMax: 25, tempoRecargaMs: 1650,
      velocidadeProjetil: 15, dispersao: 0.05, corProjetil: "#ffc24d",
      automatica: true, projeteisPorTiro: 1
    },
    m60: {
      nome: "M60", categoria: "Fuzil Pesado", nivelMinimo: 10,
      dano: 26, cadenciaMs: 80, municaoMax: 60, tempoRecargaMs: 2600,
      velocidadeProjetil: 15, dispersao: 0.075, corProjetil: "#ff7a3d",
      automatica: true, projeteisPorTiro: 1
    },
    minigun: {
      nome: "Minigun", categoria: "Fuzil Pesado", nivelMinimo: 11,
      dano: 16, cadenciaMs: 35, municaoMax: 120, tempoRecargaMs: 3400,
      velocidadeProjetil: 16, dispersao: 0.1, corProjetil: "#ff5a5a",
      automatica: true, projeteisPorTiro: 1
    },

    // --- ESPINGARDAS (múltiplos projéteis em leque) ---
    espingarda: {
      nome: "Espingarda", categoria: "Shotgun", nivelMinimo: 3,
      dano: 13, cadenciaMs: 700, municaoMax: 6, tempoRecargaMs: 1800,
      velocidadeProjetil: 12, dispersao: 0.22, corProjetil: "#d8a23a",
      automatica: false, projeteisPorTiro: 6
    },
    espingarda_serra: {
      nome: "Espingarda Serrada", categoria: "Shotgun", nivelMinimo: 6,
      dano: 16, cadenciaMs: 600, municaoMax: 4, tempoRecargaMs: 2000,
      velocidadeProjetil: 11, dispersao: 0.3, corProjetil: "#c98a2a",
      automatica: false, projeteisPorTiro: 7
    },
    spas12: {
      nome: "SPAS-12", categoria: "Shotgun", nivelMinimo: 9,
      dano: 15, cadenciaMs: 450, municaoMax: 8, tempoRecargaMs: 2100,
      velocidadeProjetil: 13, dispersao: 0.2, corProjetil: "#e0a83a",
      automatica: false, projeteisPorTiro: 7
    },
    autoshotgun: {
      nome: "Auto Shotgun", categoria: "Shotgun", nivelMinimo: 11,
      dano: 12, cadenciaMs: 260, municaoMax: 16, tempoRecargaMs: 2400,
      velocidadeProjetil: 13, dispersao: 0.24, corProjetil: "#f0b84d",
      automatica: true, projeteisPorTiro: 6
    },

    // --- ESPECIAIS / SNIPER / EXPLOSIVOS ---
    sniper: {
      nome: "Rifle Sniper", categoria: "Especial", nivelMinimo: 8,
      dano: 95, cadenciaMs: 1100, municaoMax: 5, tempoRecargaMs: 2200,
      velocidadeProjetil: 22, dispersao: 0.005, corProjetil: "#ffffff",
      automatica: false, projeteisPorTiro: 1
    },
    crossbow: {
      nome: "Besta Automática", categoria: "Especial", nivelMinimo: 10,
      dano: 34, cadenciaMs: 380, municaoMax: 10, tempoRecargaMs: 1500,
      velocidadeProjetil: 17, dispersao: 0.02, corProjetil: "#9bffb0",
      automatica: true, projeteisPorTiro: 1
    },
    lanca_chamas: {
      nome: "Lança-Chamas", categoria: "Especial", nivelMinimo: 11,
      dano: 6, cadenciaMs: 40, municaoMax: 100, tempoRecargaMs: 2800,
      velocidadeProjetil: 8, dispersao: 0.18, corProjetil: "#ff7a1f",
      automatica: true, projeteisPorTiro: 1
    },
    lanca_granadas: {
      nome: "Lança-Granadas", categoria: "Especial", nivelMinimo: 12,
      dano: 70, cadenciaMs: 900, municaoMax: 4, tempoRecargaMs: 2600,
      velocidadeProjetil: 10, dispersao: 0.05, corProjetil: "#7aff7a",
      automatica: false, projeteisPorTiro: 1
    },
    railgun: {
      nome: "Railgun Experimental", categoria: "Especial", nivelMinimo: 12,
      dano: 140, cadenciaMs: 1300, municaoMax: 3, tempoRecargaMs: 2400,
      velocidadeProjetil: 26, dispersao: 0.003, corProjetil: "#9affff",
      automatica: false, projeteisPorTiro: 1
    }
  };

  // ----------------------------------------------------------
  // SKINS — visual do sobrevivente (militar / médico / robô)
  // ----------------------------------------------------------
  const DEFINICAO_SKINS = {
    militar: {
      nome: "Militar",
      descricao: "Colete tático, capacete e fuzil",
      corPrincipal: "#4a5a40",
      corSecundaria: "#3a4632"
    },
    medico: {
      nome: "Médico",
      descricao: "Jaleco contaminado e máscara",
      corPrincipal: "#d8d4c0",
      corSecundaria: "#8fb8a8"
    },
    robo: {
      nome: "Robô",
      descricao: "Unidade de contenção autônoma",
      corPrincipal: "#7a8088",
      corSecundaria: "#3a4248"
    }
  };

  const ORDEM_SKINS = ["militar", "medico", "robo"];

  // ----------------------------------------------------------
  // PODERES — catálogo de poderes selecionáveis para a tecla Q
  // ----------------------------------------------------------
  const DEFINICAO_PODERES = {
    sai_capeta: {
      nome: "Sai Capeta!!",
      icone: "👋",
      descricao: "Empurra todos os infectados próximos para longe.",
      cooldownMs: 8000
    },
    raio_laser: {
      nome: "Raio Laser",
      icone: "⚡",
      descricao: "Rajada de plasma que mata instantaneamente tudo numa área à frente.",
      cooldownMs: 90000,
      raioArea: 230,
      alcance: 420
    },
    espinafre: {
      nome: "Espinafre",
      icone: "🥬",
      descricao: "Engole o espinafre e fica turbinado: balas ficam bem maiores e alcançam muito mais longe por 5 segundos.",
      cooldownMs: 45000,
      duracaoMs: 5000,
      multiplicadorTamanho: 3,
      multiplicadorAlcance: 4
    }
  };

  const ORDEM_PODERES = ["sai_capeta", "raio_laser", "espinafre"];

  // ----------------------------------------------------------
  // LOADOUT — escolhas do jogador feitas no menu antes de começar
  // ----------------------------------------------------------
  const loadout = {
    skin: "militar",
    armasSelecionadas: ["glock", "metralhadora", "espingarda"], // 3 padrão
    poder: "sai_capeta"
  };

  // ----------------------------------------------------------
  // ESTADO DO PODER ATIVO NA PARTIDA (cooldown, etc.)
  // os valores de cooldown/área vêm de DEFINICAO_PODERES[loadout.poder]
  // ----------------------------------------------------------
  const estadoPoder = {
    pronto: true,
    ultimoUsoEm: -99999
  };

  // ----------------------------------------------------------
  // BUFF DO ESPINAFRE — balas maiores e com alcance muito maior
  // por um tempo limitado, independente de qual poder está
  // equipado na tecla Q no momento em que expira
  // ----------------------------------------------------------
  const buffEspinafre = {
    ativo: false,
    expiraEm: 0
  };

  function espinafreEstaAtivo(ts) {
    if (buffEspinafre.ativo && ts >= buffEspinafre.expiraEm) {
      buffEspinafre.ativo = false;
    }
    return buffEspinafre.ativo;
  }

  // ----------------------------------------------------------
  // ESTADO DO JOGO
  // ----------------------------------------------------------
  const jogador = {
    x: 0,
    y: 0,
    raio: 16,
    velocidade: 3.4,
    vidaMax: 100,
    vida: 100,
    nivel: 1,
    exp: 0,
    expParaSubir: 200,
    abates: 0,
    armaAtual: "glock",
    armasDesbloqueadas: {},
    municao: {},          // municao atual de cada arma
    recarregando: false,
    ultimoTiroEm: 0
  };

  function inicializarInventario() {
    jogador.armasDesbloqueadas = {};
    jogador.municao = {};
    // apenas as 3 armas escolhidas no menu ficam disponíveis na partida
    loadout.armasSelecionadas.forEach(k => {
      jogador.armasDesbloqueadas[k] = true;
      jogador.municao[k] = DEFINICAO_ARMAS[k].municaoMax;
    });
    jogador.armaAtual = loadout.armasSelecionadas[0];
  }
  inicializarInventario();

  let projeteis = [];
  let zumbis = [];
  let particulas = [];     // sangue / impacto
  let pickups = [];        // drops de exp (frasco verde)
  let ondasChoque = [];    // efeito visual do SAI CAPETA

  let mouseX = 0, mouseY = 0;
  let teclasPressionadas = {};

  // vetor analógico do manche virtual de movimento (mobile), -1..1 em cada eixo
  let toqueMovimentoX = 0, toqueMovimentoY = 0;

  let jogoAtivo = false;
  let tempoDecorridoJogo = 0;
  let ultimoFrameTs = 0;

  // histórico de batimento para o ECG
  let pontosEcg = new Array(40).fill(20);
  let faseEcg = 0;

  // ----------------------------------------------------------
  // CENÁRIO: HOSPITAL ABANDONADO (gerado proceduralmente)
  // salas, manchas, detritos, fiação solta
  // ----------------------------------------------------------
  let elementosCenario = [];

  function gerarCenario() {
    elementosCenario = [];
    const largura = canvas.width;
    const altura = canvas.height;

    // manchas de mofo/sangue seco no piso
    for (let i = 0; i < 26; i++) {
      elementosCenario.push({
        tipo: "mancha",
        x: Math.random() * largura,
        y: Math.random() * altura,
        raio: 18 + Math.random() * 50,
        cor: Math.random() > 0.5 ? "rgba(58,74,63,0.35)" : "rgba(74,30,30,0.25)"
      });
    }

    // azulejos rachados / linhas de piso de hospital
    for (let i = 0; i < 14; i++) {
      elementosCenario.push({
        tipo: "racha",
        x: Math.random() * largura,
        y: Math.random() * altura,
        comprimento: 30 + Math.random() * 70,
        angulo: Math.random() * Math.PI * 2
      });
    }

    // macas / detritos (retângulos)
    for (let i = 0; i < 8; i++) {
      elementosCenario.push({
        tipo: "detrito",
        x: Math.random() * largura,
        y: Math.random() * altura,
        largura: 40 + Math.random() * 30,
        altura: 16 + Math.random() * 10,
        angulo: Math.random() * Math.PI
      });
    }
  }

  // ----------------------------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------------------------
  function distancia(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function agora() {
    return performance.now();
  }

  function aleatorioEntre(min, max) {
    return min + Math.random() * (max - min);
  }

  // ----------------------------------------------------------
  // SISTEMA DE ONDAS
  // onda 1 = 10 zumbis; cada onda seguinte tem +10 zumbis;
  // a próxima onda só começa quando a anterior é totalmente eliminada
  // ----------------------------------------------------------
  const ondaInfo = {
    numero: 0,
    totalNaOnda: 0,
    restantesParaSpawnar: 0,
    abatidosNaOnda: 0,
    emIntervalo: true,
    tempoProximaOndaEm: 0,
    intervaloEntreOndasMs: 4000,
    tempoUltimoSpawnMs: 0,
    intervaloSpawnMs: 700,
    ehOndaChefe: false,
    chefeSpawnado: false
  };

  // a cada 5 ondas (5, 10, 15...) a onda vira uma "onda de chefe"
  const INTERVALO_ONDA_CHEFE = 5;

  function zumbisNaOnda(numeroOnda) {
    return 6 * numeroOnda; // onda 1 = 6, onda 2 = 12, onda 3 = 18...
  }

  function ehNumeroOndaDeChefe(numeroOnda) {
    return numeroOnda > 0 && numeroOnda % INTERVALO_ONDA_CHEFE === 0;
  }

  function iniciarProximaOnda() {
    ondaInfo.numero += 1;
    ondaInfo.ehOndaChefe = ehNumeroOndaDeChefe(ondaInfo.numero);
    ondaInfo.chefeSpawnado = false;

    if (ondaInfo.ehOndaChefe) {
      // onda de chefe: leva menos infectados comuns, mas traz 1 chefe
      ondaInfo.totalNaOnda = Math.ceil(zumbisNaOnda(ondaInfo.numero) * 0.5) + 1; // +1 conta o chefe
      ondaInfo.restantesParaSpawnar = ondaInfo.totalNaOnda - 1; // o chefe spawna à parte, imediatamente
    } else {
      ondaInfo.totalNaOnda = zumbisNaOnda(ondaInfo.numero);
      ondaInfo.restantesParaSpawnar = ondaInfo.totalNaOnda;
    }

    ondaInfo.abatidosNaOnda = 0;
    ondaInfo.emIntervalo = false;
    // spawns ficam levemente mais rápidos em ondas avançadas, com piso mínimo
    ondaInfo.intervaloSpawnMs = Math.max(220, 700 - ondaInfo.numero * 25);

    if (ondaInfo.ehOndaChefe) {
      zumbis.push(criarChefe(ondaInfo.numero));
      ondaInfo.chefeSpawnado = true;
    }

    mostrarAvisoOnda();
    atualizarHudOnda();
  }

  function atualizarOndas(ts) {
    if (ondaInfo.emIntervalo) {
      if (ts >= ondaInfo.tempoProximaOndaEm) {
        iniciarProximaOnda();
      }
      return;
    }

    // ainda há zumbis para spawnar nesta onda
    if (ondaInfo.restantesParaSpawnar > 0 && ts - ondaInfo.tempoUltimoSpawnMs > ondaInfo.intervaloSpawnMs) {
      zumbis.push(criarZumbi());
      ondaInfo.restantesParaSpawnar -= 1;
      ondaInfo.tempoUltimoSpawnMs = ts;
    }

    // onda termina quando todos os zumbis foram spawnados e eliminados
    if (ondaInfo.restantesParaSpawnar <= 0 && zumbis.length === 0) {
      ondaInfo.emIntervalo = true;
      ondaInfo.tempoProximaOndaEm = ts + ondaInfo.intervaloEntreOndasMs;
    }

    atualizarHudOnda();
  }

  function onZumbiMorto() {
    ondaInfo.abatidosNaOnda += 1;
  }

  function mostrarAvisoOnda() {
    elAvisoOnda.textContent = ondaInfo.ehOndaChefe
      ? `⚠ ONDA ${ondaInfo.numero} — UM CHEFE SE APROXIMA ⚠`
      : `ONDA ${ondaInfo.numero} — ${ondaInfo.totalNaOnda} INFECTADOS`;
    elAvisoOnda.classList.remove("escondido");
    elAvisoOnda.classList.toggle("aviso-onda-chefe", ondaInfo.ehOndaChefe);
    elAvisoOnda.style.animation = "none";
    requestAnimationFrame(() => { elAvisoOnda.style.animation = ""; });
    setTimeout(() => elAvisoOnda.classList.add("escondido"), 2200);
  }

  function atualizarHudOnda() {
    elTextoOnda.textContent = ondaInfo.numero || 1;
    const vivosOuPendentes = ondaInfo.totalNaOnda - ondaInfo.abatidosNaOnda;
    elTextoOndaRestantes.textContent = ondaInfo.emIntervalo
      ? "0"
      : Math.max(0, vivosOuPendentes);

    if (ondaInfo.emIntervalo && ondaInfo.numero > 0) {
      const restanteS = Math.max(0, Math.ceil((ondaInfo.tempoProximaOndaEm - agora()) / 1000));
      elStatusOnda.textContent = `PRÓXIMA ONDA EM ${restanteS}s`;
    } else if (ondaInfo.ehOndaChefe) {
      elStatusOnda.textContent = "⚠ CHEFE ATIVO";
    } else {
      elStatusOnda.textContent = "EM ANDAMENTO";
    }
  }

  // ----------------------------------------------------------
  // ZUMBIS
  // ----------------------------------------------------------
  function criarZumbi() {
    // posiciona na borda da tela, fora da visão direta
    const borda = Math.floor(Math.random() * 4);
    let x, y;
    const m = 40;
    switch (borda) {
      case 0: x = -m; y = Math.random() * canvas.height; break;
      case 1: x = canvas.width + m; y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width; y = -m; break;
      default: x = Math.random() * canvas.width; y = canvas.height + m; break;
    }

    // zumbis ficam um pouco mais fortes com o nível do jogador
    const escalaNivel = 1 + (jogador.nivel - 1) * 0.12;

    // drop de exp começa em 20 e sobe +15 a cada nível do jogador
    const dropExp = 20 + (jogador.nivel - 1) * 15;

    return {
      x, y,
      raio: 15,
      vida: 40 * escalaNivel,
      vidaMax: 40 * escalaNivel,
      velocidade: aleatorioEntre(0.9, 1.6) * (1 + (jogador.nivel - 1) * 0.04),
      dano: 8 * escalaNivel,
      dropExp,
      ultimoAtaqueEm: 0,
      cadenciaAtaqueMs: 700,
      balancoFase: Math.random() * Math.PI * 2,
      empurraoX: 0,
      empurraoY: 0,
      eChefe: false
    };
  }

  // ----------------------------------------------------------
  // CHEFE — zumbi de elite que aparece a cada INTERVALO_ONDA_CHEFE ondas
  // bem maior, muito mais resistente, mais lento, dano alto e drop generoso
  // ----------------------------------------------------------
  function criarChefe(numeroOnda) {
    const borda = Math.floor(Math.random() * 4);
    let x, y;
    const m = 60;
    switch (borda) {
      case 0: x = -m; y = Math.random() * canvas.height; break;
      case 1: x = canvas.width + m; y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width; y = -m; break;
      default: x = Math.random() * canvas.width; y = canvas.height + m; break;
    }

    // escala com nível do jogador e com quantas ondas de chefe já passaram
    const tierChefe = Math.floor(numeroOnda / INTERVALO_ONDA_CHEFE); // 1, 2, 3...
    const escalaNivel = 1 + (jogador.nivel - 1) * 0.12;
    const vidaBase = 900 * tierChefe * escalaNivel;
    const dropExp = 250 + (tierChefe - 1) * 150 + (jogador.nivel - 1) * 30;

    return {
      x, y,
      raio: 40,
      vida: vidaBase,
      vidaMax: vidaBase,
      velocidade: aleatorioEntre(0.55, 0.75) * (1 + (jogador.nivel - 1) * 0.03),
      dano: 26 * escalaNivel,
      dropExp,
      ultimoAtaqueEm: 0,
      cadenciaAtaqueMs: 900,
      balancoFase: Math.random() * Math.PI * 2,
      empurraoX: 0,
      empurraoY: 0,
      eChefe: true,
      nomeChefe: `CHEFE DA ONDA ${numeroOnda}`
    };
  }

  function atualizarZumbis(dt) {
    for (let i = zumbis.length - 1; i >= 0; i--) {
      const z = zumbis[i];

      // aplica o empurrão do SAI CAPETA com atrito, sobrepondo a perseguição
      if (Math.abs(z.empurraoX) > 0.05 || Math.abs(z.empurraoY) > 0.05) {
        z.x += z.empurraoX;
        z.y += z.empurraoY;
        z.empurraoX *= 0.88;
        z.empurraoY *= 0.88;
      } else {
        z.empurraoX = 0;
        z.empurraoY = 0;
      }

      const dx = jogador.x - z.x;
      const dy = jogador.y - z.y;
      const dist = Math.hypot(dx, dy) || 1;

      // enquanto está sendo empurrado, o zumbi perde tração e não persegue
      const empurradoForte = Math.hypot(z.empurraoX, z.empurraoY) > 1.2;
      if (!empurradoForte) {
        z.x += (dx / dist) * z.velocidade;
        z.y += (dy / dist) * z.velocidade;
      }
      z.balancoFase += 0.15;

      // ataque corpo a corpo no jogador
      if (dist < z.raio + jogador.raio && !empurradoForte) {
        const ts = agora();
        if (ts - z.ultimoAtaqueEm > z.cadenciaAtaqueMs) {
          z.ultimoAtaqueEm = ts;
          jogador.vida -= z.dano;
          criarParticulasSangue(jogador.x, jogador.y, "#b53030", 6);
          if (jogador.vida <= 0) {
            jogador.vida = 0;
            finalizarJogo();
          }
        }
      }

      if (z.vida <= 0) {
        criarParticulasSangue(z.x, z.y, "#5c7263", 14);
        pickups.push({ x: z.x, y: z.y, valor: z.dropExp, raio: 7, fase: 0 });
        zumbis.splice(i, 1);
        jogador.abates += 1;
        onZumbiMorto();
      }
    }
  }

  function criarParticulasSangue(x, y, cor, qtd) {
    for (let i = 0; i < qtd; i++) {
      const ang = Math.random() * Math.PI * 2;
      const vel = aleatorioEntre(1, 4.5);
      particulas.push({
        x, y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        vida: 1,
        cor,
        raio: aleatorioEntre(1.5, 3.5)
      });
    }
  }

  function atualizarParticulas() {
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.vida -= 0.035;
      if (p.vida <= 0) particulas.splice(i, 1);
    }
  }

  // ----------------------------------------------------------
  // PICKUPS DE EXP (frasco verde solto pelo zumbi)
  // ----------------------------------------------------------
  function atualizarPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.fase += 0.08;
      const dist = distancia(jogador.x, jogador.y, p.x, p.y);
      if (dist < 40) {
        // atrai suavemente o frasco para o jogador
        p.x += (jogador.x - p.x) * 0.18;
        p.y += (jogador.y - p.y) * 0.18;
      }
      if (dist < jogador.raio + p.raio) {
        ganharExp(p.valor);
        pickups.splice(i, 1);
      }
    }
  }

  // ----------------------------------------------------------
  // SISTEMA DE NÍVEL / EXP
  // ----------------------------------------------------------
  function ganharExp(valor) {
    jogador.exp += valor;
    while (jogador.exp >= jogador.expParaSubir) {
      jogador.exp -= jogador.expParaSubir;
      subirNivel();
    }
    atualizarHud();
  }

  function subirNivel() {
    jogador.nivel += 1;
    jogador.expParaSubir *= 2; // dobra a cada nível, conforme pedido
    jogador.vidaMax += 8;
    jogador.vida = Math.min(jogador.vidaMax, jogador.vida + jogador.vidaMax * 0.3);

    // a cada nível, equipa automaticamente a arma mais rápida dentre
    // as 3 selecionadas no menu (não há mais desbloqueio progressivo)
    const maisRapida = loadout.armasSelecionadas.slice().sort(
      (a, b) => DEFINICAO_ARMAS[a].cadenciaMs - DEFINICAO_ARMAS[b].cadenciaMs
    )[0];
    if (maisRapida) jogador.armaAtual = maisRapida;

    mostrarAvisoNivel();
    atualizarSlotsArma();
    atualizarHud();
  }

  function mostrarAvisoNivel() {
    elAvisoNivel.textContent = `NÍVEL ${jogador.nivel} ALCANÇADO`;
    elAvisoNivel.classList.remove("escondido");
    elAvisoNivel.style.animation = "none";
    requestAnimationFrame(() => {
      elAvisoNivel.style.animation = "";
    });
    setTimeout(() => elAvisoNivel.classList.add("escondido"), 1800);
  }

  // ----------------------------------------------------------
  // PODERES — dispatcher genérico para a tecla Q
  // o poder ativo é definido por loadout.poder, escolhido no menu
  // ----------------------------------------------------------
  let raiosLaser = []; // efeito visual do feixe de plasma

  function usarPoderAtivo(ts) {
    const def = DEFINICAO_PODERES[loadout.poder];
    if (!estadoPoder.pronto) return;
    if (ts - estadoPoder.ultimoUsoEm < def.cooldownMs) return;

    estadoPoder.ultimoUsoEm = ts;
    estadoPoder.pronto = false;

    if (loadout.poder === "sai_capeta") {
      executarSaiCapeta(def);
    } else if (loadout.poder === "raio_laser") {
      executarRaioLaser(def);
    } else if (loadout.poder === "espinafre") {
      executarEspinafre(def, ts);
    }
  }

  // --- ESPINAFRE: por 5s, balas ficam maiores e com alcance bem maior ---
  function executarEspinafre(def, ts) {
    buffEspinafre.ativo = true;
    buffEspinafre.expiraEm = ts + def.duracaoMs;
    exibirGritoFlutuante("ESPINAFRE!!", "#6fff8f");
  }

  // --- SAI CAPETA: empurra todos os zumbis próximos para longe ---
  function executarSaiCapeta(def) {
    const raioEmpurrao = 260;
    const forcaEmpurrao = 16;

    zumbis.forEach(z => {
      const dx = z.x - jogador.x;
      const dy = z.y - jogador.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > raioEmpurrao) return;

      // empurrão mais forte quanto mais próximo o zumbi estiver
      const intensidade = (1 - dist / raioEmpurrao) * forcaEmpurrao;
      z.empurraoX = (dx / dist) * intensidade;
      z.empurraoY = (dy / dist) * intensidade;

      criarParticulasSangue(z.x, z.y, "#5c7263", 4);
    });

    ondasChoque.push({ x: jogador.x, y: jogador.y, raio: 10, raioMax: raioEmpurrao, vida: 1 });
    exibirGritoFlutuante("SAI CAPETA!!", "#ff5a3d");
  }

  // --- RAIO LASER: rajada de plasma que mata instantaneamente uma área à frente ---
  function executarRaioLaser(def) {
    const angulo = Math.atan2(mouseY - jogador.y, mouseX - jogador.x);
    const alvoX = jogador.x + Math.cos(angulo) * def.alcance;
    const alvoY = jogador.y + Math.sin(angulo) * def.alcance;

    // qualquer zumbi comum dentro do raio de área ao redor do ponto de impacto morre instantaneamente;
    // chefes são resistentes demais para morrer num só golpe e recebem dano pesado em vez disso
    const DANO_LASER_CHEFE = 500;
    for (let i = zumbis.length - 1; i >= 0; i--) {
      const z = zumbis[i];
      if (distancia(z.x, z.y, alvoX, alvoY) <= def.raioArea) {
        criarParticulasSangue(z.x, z.y, "#9affff", 16);

        if (z.eChefe) {
          z.vida -= DANO_LASER_CHEFE;
          if (z.vida > 0) continue; // chefe sobrevive, só perde vida
        }

        pickups.push({ x: z.x, y: z.y, valor: z.dropExp, raio: 7, fase: 0 });
        zumbis.splice(i, 1);
        jogador.abates += 1;
        onZumbiMorto();
      }
    }

    raiosLaser.push({
      x1: jogador.x, y1: jogador.y,
      x2: alvoX, y2: alvoY,
      areaX: alvoX, areaY: alvoY, areaRaio: def.raioArea,
      vida: 1
    });

    exibirGritoFlutuante("RAIO LASER!!", "#9affff");
  }

  function exibirGritoFlutuante(texto, cor) {
    const rect = canvas.getBoundingClientRect();
    const elGrito = document.createElement("div");
    elGrito.className = "grito-capeta";
    elGrito.textContent = texto;
    elGrito.style.color = cor;
    elGrito.style.left = (rect.left + jogador.x) + "px";
    elGrito.style.top = (rect.top + jogador.y - 50) + "px";
    document.body.appendChild(elGrito);
    setTimeout(() => elGrito.remove(), 700);
  }

  function atualizarOndasChoque() {
    for (let i = ondasChoque.length - 1; i >= 0; i--) {
      const o = ondasChoque[i];
      o.raio += (o.raioMax - o.raio) * 0.18;
      o.vida -= 0.045;
      if (o.vida <= 0) ondasChoque.splice(i, 1);
    }
  }

  function desenharOndasChoque() {
    ondasChoque.forEach(o => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,90,61,${Math.max(0, o.vida)})`;
      ctx.lineWidth = 4;
      ctx.arc(o.x, o.y, o.raio, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function atualizarRaiosLaser() {
    for (let i = raiosLaser.length - 1; i >= 0; i--) {
      const r = raiosLaser[i];
      r.vida -= 0.05;
      if (r.vida <= 0) raiosLaser.splice(i, 1);
    }
  }

  function desenharRaiosLaser() {
    raiosLaser.forEach(r => {
      const alpha = Math.max(0, r.vida);

      // feixe do plasma
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#9affff";
      ctx.shadowColor = "#9affff";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(r.x1, r.y1);
      ctx.lineTo(r.x2, r.y2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();

      // área de impacto (círculo de explosão)
      ctx.beginPath();
      ctx.strokeStyle = `rgba(154,255,255,${alpha})`;
      ctx.lineWidth = 3;
      ctx.arc(r.areaX, r.areaY, r.areaRaio * (1.1 - r.vida * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function atualizarHudPoder(ts) {
    const def = DEFINICAO_PODERES[loadout.poder];
    const decorrido = ts - estadoPoder.ultimoUsoEm;
    if (decorrido >= def.cooldownMs) {
      estadoPoder.pronto = true;
      elBarraPoder.style.width = "100%";
      elStatusPoder.textContent = "PRONTO";
      elStatusPoder.classList.remove("em-espera");
    } else {
      const pct = (decorrido / def.cooldownMs) * 100;
      elBarraPoder.style.width = pct + "%";
      const restante = Math.ceil((def.cooldownMs - decorrido) / 1000);
      elStatusPoder.textContent = `RECARGA ${restante}s`;
      elStatusPoder.classList.add("em-espera");
    }
  }

  // ----------------------------------------------------------
  // ARMAS — disparo, troca, recarga
  // ----------------------------------------------------------
  function trocarArma(chaveArma) {
    if (!DEFINICAO_ARMAS[chaveArma]) return;
    if (!jogador.armasDesbloqueadas[chaveArma]) return;
    if (jogador.recarregando) return;
    jogador.armaAtual = chaveArma;
    atualizarSlotsArma();
    atualizarHud();
  }

  function navegarInventario(direcao) {
    const indiceAtual = loadout.armasSelecionadas.indexOf(jogador.armaAtual);
    const chave = encontrarArmaDesbloqueada(indiceAtual, direcao);
    if (chave) trocarArma(chave);
  }

  function tentarRecarregar() {
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    if (jogador.recarregando) return;
    if (jogador.municao[jogador.armaAtual] >= def.municaoMax) return;

    jogador.recarregando = true;
    elAvisoRecarga.classList.remove("escondido");

    setTimeout(() => {
      jogador.municao[jogador.armaAtual] = def.municaoMax;
      jogador.recarregando = false;
      elAvisoRecarga.classList.add("escondido");
      atualizarHud();
    }, def.tempoRecargaMs);
  }

  function tentarAtirar(ts) {
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    if (jogador.recarregando) return;

    if (jogador.municao[jogador.armaAtual] <= 0) {
      tentarRecarregar();
      return;
    }

    if (ts - jogador.ultimoTiroEm < def.cadenciaMs) return;
    jogador.ultimoTiroEm = ts;

    jogador.municao[jogador.armaAtual] -= 1;

    const anguloBase = Math.atan2(mouseY - jogador.y, mouseX - jogador.x);
    const qtdProjeteis = def.projeteisPorTiro || 1;

    // ESPINAFRE ativo: balas maiores (raio) e com vida útil maior (alcance)
    const espinafreAtivo = espinafreEstaAtivo(ts);
    const defEspinafre = DEFINICAO_PODERES.espinafre;
    const raioProjetil = espinafreAtivo ? 3 * defEspinafre.multiplicadorTamanho : 3;
    const vidaProjetil = espinafreAtivo ? 70 * defEspinafre.multiplicadorAlcance : 70;

    for (let i = 0; i < qtdProjeteis; i++) {
      const angulo = anguloBase + aleatorioEntre(-def.dispersao, def.dispersao);
      projeteis.push({
        x: jogador.x + Math.cos(angulo) * (jogador.raio + 6),
        y: jogador.y + Math.sin(angulo) * (jogador.raio + 6),
        vx: Math.cos(angulo) * def.velocidadeProjetil,
        vy: Math.sin(angulo) * def.velocidadeProjetil,
        dano: def.dano,
        cor: def.corProjetil,
        raio: raioProjetil,
        vida: vidaProjetil,
        espinafre: espinafreAtivo
      });
    }

    // recarga automática quando esvazia
    if (jogador.municao[jogador.armaAtual] <= 0) {
      tentarRecarregar();
    }

    atualizarHud();
  }

  function atualizarProjeteis() {
    for (let i = projeteis.length - 1; i >= 0; i--) {
      const p = projeteis[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vida -= 1;

      let atingiu = false;
      for (let j = zumbis.length - 1; j >= 0; j--) {
        const z = zumbis[j];
        if (distancia(p.x, p.y, z.x, z.y) < z.raio + (p.raio || 0)) {
          z.vida -= p.dano;
          criarParticulasSangue(p.x, p.y, "#5c7263", 4);
          atingiu = true;
          break;
        }
      }

      if (atingiu || p.vida <= 0 ||
          p.x < -20 || p.x > canvas.width + 20 ||
          p.y < -20 || p.y > canvas.height + 20) {
        projeteis.splice(i, 1);
      }
    }
  }

  // ----------------------------------------------------------
  // MOVIMENTO DO JOGADOR
  // ----------------------------------------------------------
  function atualizarMovimentoJogador() {
    let dx = 0, dy = 0;
    if (teclasPressionadas["w"] || teclasPressionadas["arrowup"]) dy -= 1;
    if (teclasPressionadas["s"] || teclasPressionadas["arrowdown"]) dy += 1;
    if (teclasPressionadas["a"] || teclasPressionadas["arrowleft"]) dx -= 1;
    if (teclasPressionadas["d"] || teclasPressionadas["arrowright"]) dx += 1;

    // soma o manche virtual de movimento (mobile) — vetor analógico
    dx += toqueMovimentoX;
    dy += toqueMovimentoY;

    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 0.05) {
      // no teclado o fator fica sempre travado em 1 (mesma velocidade de sempre);
      // no manche virtual ele acompanha o quanto o polegar empurrou o manche
      const fator = Math.min(magnitude, 1);
      jogador.x += (dx / magnitude) * jogador.velocidade * fator;
      jogador.y += (dy / magnitude) * jogador.velocidade * fator;
    }

    jogador.x = Math.max(jogador.raio, Math.min(canvas.width - jogador.raio, jogador.x));
    jogador.y = Math.max(jogador.raio, Math.min(canvas.height - jogador.raio, jogador.y));
  }

  // ----------------------------------------------------------
  // DESENHO — CENÁRIO
  // ----------------------------------------------------------
  function desenharCenario() {
    ctx.fillStyle = "#1d1f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elementosCenario.forEach(el => {
      if (el.tipo === "mancha") {
        ctx.beginPath();
        ctx.fillStyle = el.cor;
        ctx.ellipse(el.x, el.y, el.raio, el.raio * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.tipo === "racha") {
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + Math.cos(el.angulo) * el.comprimento, el.y + Math.sin(el.angulo) * el.comprimento);
        ctx.stroke();
      } else if (el.tipo === "detrito") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        ctx.fillStyle = "rgba(60,58,50,0.7)";
        ctx.fillRect(-el.largura / 2, -el.altura / 2, el.largura, el.altura);
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.strokeRect(-el.largura / 2, -el.altura / 2, el.largura, el.altura);
        ctx.restore();
      }
    });

    // grade de azulejos sutil
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    const tamanho = 64;
    for (let x = 0; x < canvas.width; x += tamanho) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += tamanho) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  // ----------------------------------------------------------
  // DESENHO — JOGADOR
  // ----------------------------------------------------------
  function desenharJogador() {
    const angulo = Math.atan2(mouseY - jogador.y, mouseX - jogador.x);

    // sombra no piso (comum a todas as skins)
    ctx.beginPath();
    ctx.ellipse(jogador.x, jogador.y + jogador.raio * 0.75, jogador.raio * 0.95, jogador.raio * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();

    // arma nas mãos, apontando para o mouse (comum a todas as skins)
    ctx.save();
    ctx.translate(jogador.x, jogador.y);
    ctx.rotate(angulo);
    ctx.fillStyle = "#26261f";
    ctx.fillRect(jogador.raio - 5, -3, 24, 6);
    ctx.fillStyle = "#3a3a30";
    ctx.fillRect(jogador.raio + 12, -5, 6, 10); // cano/coronha
    ctx.restore();

    // despacha para a função específica da skin selecionada
    if (loadout.skin === "medico") {
      desenharSkinMedico();
    } else if (loadout.skin === "robo") {
      desenharSkinRobo();
    } else {
      desenharSkinMilitar();
    }
  }

  // --- SKIN: MILITAR — colete camuflado, capacete tático ---
  function desenharSkinMilitar() {
    // corpo — colete tático camuflado (verde-musgo com manchas)
    ctx.beginPath();
    ctx.fillStyle = "#4a5a40";
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fill();

    // manchas de camuflagem
    ctx.fillStyle = "rgba(30,38,26,0.65)";
    ctx.beginPath();
    ctx.ellipse(jogador.x - 5, jogador.y - 4, 6, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(jogador.x + 6, jogador.y + 5, 5, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(jogador.x + 2, jogador.y - 7, 4, 3, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // contorno do colete
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.stroke();

    // cinto tático / fivela
    ctx.strokeStyle = "#2b2b22";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y + jogador.raio * 0.5, jogador.raio * 0.85, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.fillStyle = "#8a8a70";
    ctx.fillRect(jogador.x - 3, jogador.y + jogador.raio * 0.45, 6, 5);

    // capacete militar (semicírculo no topo da cabeça)
    ctx.beginPath();
    ctx.fillStyle = "#3a4632";
    ctx.arc(jogador.x, jogador.y, jogador.raio * 0.72, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // tira de pano do capacete
    ctx.strokeStyle = "#6f5a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(jogador.x - jogador.raio * 0.7, jogador.y - 1);
    ctx.lineTo(jogador.x + jogador.raio * 0.7, jogador.y - 1);
    ctx.stroke();

    // cruz médica pequena no peito (suporte/resgate)
    ctx.strokeStyle = "#b53030";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(jogador.x - 4, jogador.y + 6);
    ctx.lineTo(jogador.x + 4, jogador.y + 6);
    ctx.moveTo(jogador.x, jogador.y + 2);
    ctx.lineTo(jogador.x, jogador.y + 10);
    ctx.stroke();
  }

  // --- SKIN: MÉDICO — jaleco manchado de sangue, máscara cirúrgica ---
  function desenharSkinMedico() {
    // corpo — jaleco branco sujo
    ctx.beginPath();
    ctx.fillStyle = "#d8d4c0";
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fill();

    // manchas de sangue no jaleco
    ctx.fillStyle = "rgba(122,31,31,0.55)";
    ctx.beginPath();
    ctx.ellipse(jogador.x - 4, jogador.y + 4, 5, 3.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(jogador.x + 5, jogador.y - 2, 3.5, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // contorno do jaleco
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.stroke();

    // gola de jaleco aberta (linha em V no peito)
    ctx.strokeStyle = "#8fb8a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(jogador.x - 6, jogador.y - 8);
    ctx.lineTo(jogador.x, jogador.y);
    ctx.lineTo(jogador.x + 6, jogador.y - 8);
    ctx.stroke();

    // crachá de identificação
    ctx.fillStyle = "#8fb8a8";
    ctx.fillRect(jogador.x - 9, jogador.y + 1, 6, 4);

    // touca cirúrgica (semicírculo verde-azulado no topo)
    ctx.beginPath();
    ctx.fillStyle = "#8fb8a8";
    ctx.arc(jogador.x, jogador.y, jogador.raio * 0.72, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // máscara cirúrgica cobrindo a parte inferior do rosto
    ctx.beginPath();
    ctx.fillStyle = "#bcd4c4";
    ctx.ellipse(jogador.x, jogador.y + 1, jogador.raio * 0.42, jogador.raio * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 1;
    ctx.stroke();
    // elástico da máscara
    ctx.strokeStyle = "#8fb8a8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(jogador.x - jogador.raio * 0.6, jogador.y - 2);
    ctx.lineTo(jogador.x + jogador.raio * 0.6, jogador.y - 2);
    ctx.stroke();
  }

  // --- SKIN: ROBÔ — unidade de contenção autônoma, visor e antena ---
  function desenharSkinRobo() {
    // corpo — chassi metálico
    ctx.beginPath();
    ctx.fillStyle = "#7a8088";
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fill();

    // painéis/rebites do chassi
    ctx.fillStyle = "rgba(20,22,24,0.5)";
    ctx.beginPath();
    ctx.rect(jogador.x - jogador.raio * 0.55, jogador.y - 2, jogador.raio * 1.1, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(jogador.x - 8, jogador.y + 6, 1.6, 0, Math.PI * 2);
    ctx.arc(jogador.x + 8, jogador.y + 6, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // contorno do chassi
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.stroke();

    // núcleo de energia pulsante no peito
    const pulso = 0.7 + Math.sin(agora() / 180) * 0.3;
    ctx.beginPath();
    ctx.fillStyle = `rgba(122,212,255,${pulso})`;
    ctx.shadowColor = "#7ad4ff";
    ctx.shadowBlur = 8;
    ctx.arc(jogador.x, jogador.y + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // cabeçote/visor (semicírculo escuro no topo)
    ctx.beginPath();
    ctx.fillStyle = "#3a4248";
    ctx.arc(jogador.x, jogador.y, jogador.raio * 0.72, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = "#1a1a17";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // visor luminoso (linha horizontal brilhante)
    ctx.strokeStyle = "#7ad4ff";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#7ad4ff";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(jogador.x - jogador.raio * 0.55, jogador.y - 4);
    ctx.lineTo(jogador.x + jogador.raio * 0.55, jogador.y - 4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // antena
    ctx.strokeStyle = "#3a4248";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(jogador.x, jogador.y - jogador.raio * 0.72);
    ctx.lineTo(jogador.x, jogador.y - jogador.raio * 1.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "#ff5a3d";
    ctx.arc(jogador.x, jogador.y - jogador.raio * 1.05, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ----------------------------------------------------------
  // DESENHO — ZUMBIS
  // ----------------------------------------------------------
  function desenharZumbis() {
    zumbis.forEach(z => {
      const balanco = Math.sin(z.balancoFase) * (z.eChefe ? 1.5 : 3);

      // sombra
      ctx.beginPath();
      ctx.ellipse(z.x, z.y + z.raio * 0.7, z.raio * 0.9, z.raio * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();

      // corpo zumbi (chefes ganham cor própria e contorno pulsante)
      ctx.beginPath();
      ctx.fillStyle = z.eChefe ? "#7a1f1f" : "#5c6b54";
      ctx.arc(z.x + balanco * 0.2, z.y, z.raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = z.eChefe ? "#ff5a3c" : "#1a1a17";
      ctx.lineWidth = z.eChefe ? 4 : 2;
      ctx.stroke();

      // olhos
      ctx.fillStyle = z.eChefe ? "#ffcf3a" : "#b53030";
      ctx.beginPath();
      ctx.arc(z.x - z.raio * 0.32, z.y - z.raio * 0.2, z.eChefe ? 4 : 2, 0, Math.PI * 2);
      ctx.arc(z.x + z.raio * 0.32, z.y - z.raio * 0.2, z.eChefe ? 4 : 2, 0, Math.PI * 2);
      ctx.fill();

      if (z.eChefe) {
        // coroa simples para identificar o chefe à distância
        ctx.fillStyle = "#ffcf3a";
        ctx.beginPath();
        ctx.moveTo(z.x - z.raio * 0.5, z.y - z.raio - 4);
        ctx.lineTo(z.x - z.raio * 0.25, z.y - z.raio - 18);
        ctx.lineTo(z.x, z.y - z.raio - 6);
        ctx.lineTo(z.x + z.raio * 0.25, z.y - z.raio - 18);
        ctx.lineTo(z.x + z.raio * 0.5, z.y - z.raio - 4);
        ctx.closePath();
        ctx.fill();

        // nome do chefe acima da coroa
        ctx.fillStyle = "#ffcf3a";
        ctx.font = "bold 13px 'Share Tech Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(z.nomeChefe, z.x, z.y - z.raio - 26);
      }

      // barra de vida do zumbi (chefes têm barra maior)
      const largBarra = z.eChefe ? 90 : 30;
      const pctVida = Math.max(0, z.vida / z.vidaMax);
      const yBarra = z.y - z.raio - (z.eChefe ? 36 : 12);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(z.x - largBarra / 2, yBarra, largBarra, z.eChefe ? 7 : 4);
      ctx.fillStyle = z.eChefe ? "#ff5a3c" : "#b53030";
      ctx.fillRect(z.x - largBarra / 2, yBarra, largBarra * pctVida, z.eChefe ? 7 : 4);
    });
  }

  // ----------------------------------------------------------
  // DESENHO — PROJÉTEIS, PARTÍCULAS, PICKUPS
  // ----------------------------------------------------------
  function desenharProjeteis() {
    projeteis.forEach(p => {
      const raioDesenho = p.raio || 3;
      ctx.beginPath();
      ctx.fillStyle = p.espinafre ? "#6fff8f" : p.cor;
      ctx.shadowColor = p.espinafre ? "#6fff8f" : p.cor;
      ctx.shadowBlur = p.espinafre ? 14 : 6;
      ctx.arc(p.x, p.y, raioDesenho, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function desenharParticulas() {
    particulas.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = p.cor;
      ctx.globalAlpha = Math.max(0, p.vida);
      ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function desenharPickups() {
    pickups.forEach(p => {
      const flutua = Math.sin(p.fase) * 3;
      ctx.beginPath();
      ctx.fillStyle = "#6fff8f";
      ctx.shadowColor = "#6fff8f";
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y + flutua, p.raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // ----------------------------------------------------------
  // HUD — atualização de textos e barras
  // ----------------------------------------------------------
  function atualizarHud() {
    // vida
    const pctVida = Math.max(0, jogador.vida / jogador.vidaMax) * 100;
    elBarraVida.style.width = pctVida + "%";
    elTextoVida.textContent = Math.max(0, Math.round(jogador.vida));
    elTextoVidaMax.textContent = Math.round(jogador.vidaMax);

    // exp / nível
    const pctExp = (jogador.exp / jogador.expParaSubir) * 100;
    elBarraExp.style.width = pctExp + "%";
    elTextoExp.textContent = jogador.exp;
    elTextoExpMax.textContent = jogador.expParaSubir;
    elTextoNivel.textContent = jogador.nivel;

    // arma / munição
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    elNomeArma.textContent = def.nome.toUpperCase();
    const pctMunicao = (jogador.municao[jogador.armaAtual] / def.municaoMax) * 100;
    elSeringaLiq.style.width = pctMunicao + "%";
    elTextoMunicao.textContent = jogador.municao[jogador.armaAtual];
    elTextoMunicaoMax.textContent = def.municaoMax;

    // abates
    elTextoAbates.textContent = jogador.abates;
  }

  function atualizarSlotsArma() {
    const lista = loadout.armasSelecionadas;
    const indiceAtual = lista.indexOf(jogador.armaAtual);
    const defAtual = DEFINICAO_ARMAS[jogador.armaAtual];

    elSlotAtualNumero.textContent = `${indiceAtual + 1}/${lista.length}`;
    elSlotAtualNome.textContent = defAtual.nome;

    const chaveAnterior = lista[(indiceAtual - 1 + lista.length) % lista.length];
    const chaveProxima = lista[(indiceAtual + 1) % lista.length];

    elSlotAnterior.textContent = lista.length > 1 ? DEFINICAO_ARMAS[chaveAnterior].nome : "—";
    elSlotProximo.textContent = lista.length > 1 ? DEFINICAO_ARMAS[chaveProxima].nome : "—";

  }

  // navega entre as 3 armas do loadout (circular), na direção indicada (1 ou -1)
  function encontrarArmaDesbloqueada(indiceInicial, direcao) {
    const lista = loadout.armasSelecionadas;
    if (lista.length <= 1) return null;
    const indice = (indiceInicial + direcao + lista.length) % lista.length;
    return lista[indice];
  }

  function atualizarEcg(ts) {
    faseEcg += 0.12;
    // batimento simulado: maior amplitude se vida baixa (tensão)
    const tensao = 1 + (1 - jogador.vida / jogador.vidaMax) * 1.8;
    const baseY = 20;
    let y = baseY;

    const cicloPos = faseEcg % (Math.PI * 2);
    if (cicloPos > 0 && cicloPos < 0.3) {
      y = baseY - 16 * tensao;
    } else if (cicloPos >= 0.3 && cicloPos < 0.45) {
      y = baseY + 8 * tensao;
    } else {
      y = baseY + Math.sin(faseEcg * 3) * 1.2;
    }

    pontosEcg.push(y);
    pontosEcg.shift();

    const largura = 220;
    const passo = largura / (pontosEcg.length - 1);
    const pontosStr = pontosEcg.map((py, i) => `${i * passo},${py}`).join(" ");
    elLinhaEcg.setAttribute("points", pontosStr);
  }

  // ----------------------------------------------------------
  // LOOP PRINCIPAL
  // ----------------------------------------------------------
  function loop(ts) {
    if (!jogoAtivo) return;
    const dt = ts - ultimoFrameTs;
    ultimoFrameTs = ts;

    atualizarMovimentoJogador();
    atualizarOndas(ts);
    atualizarZumbis(dt);
    atualizarProjeteis();
    atualizarParticulas();
    atualizarPickups();
    atualizarOndasChoque();
    atualizarRaiosLaser();
    atualizarEcg(ts);
    atualizarHudPoder(ts);

    if (teclasPressionadas["mouse"]) {
      const def = DEFINICAO_ARMAS[jogador.armaAtual];
      if (def.automatica) {
        tentarAtirar(ts);
      }
    }

    // render
    desenharCenario();
    desenharPickups();
    desenharParticulas();
    desenharZumbis();
    desenharJogador();
    desenharProjeteis();
    desenharOndasChoque();
    desenharRaiosLaser();

    requestAnimationFrame(loop);
  }

  // ----------------------------------------------------------
  // FIM DE JOGO / REINÍCIO
  // ----------------------------------------------------------
  function finalizarJogo() {
    jogoAtivo = false;
    elNivelFinal.textContent = jogador.nivel;
    elAbatesFinal.textContent = jogador.abates;
    if (elOndaFinal) elOndaFinal.textContent = ondaInfo.numero || 1;
    hud.classList.add("escondido");
    telaMorte.classList.remove("escondido");
  }

  function resetarEstado() {
    jogador.x = canvas.width / 2;
    jogador.y = canvas.height / 2;
    jogador.vidaMax = 100;
    jogador.vida = 100;
    jogador.nivel = 1;
    jogador.exp = 0;
    jogador.expParaSubir = 200;
    jogador.abates = 0;
    jogador.recarregando = false;
    jogador.ultimoTiroEm = 0;

    inicializarInventario();

    projeteis = [];
    zumbis = [];
    particulas = [];
    pickups = [];
    ondasChoque = [];
    raiosLaser = [];
    ondaInfo.numero = 0;
    ondaInfo.totalNaOnda = 0;
    ondaInfo.restantesParaSpawnar = 0;
    ondaInfo.abatidosNaOnda = 0;
    ondaInfo.emIntervalo = true;
    ondaInfo.tempoProximaOndaEm = performance.now() + 1500;
    ondaInfo.intervaloSpawnMs = 700;
    ondaInfo.ehOndaChefe = false;
    ondaInfo.chefeSpawnado = false;
    pontosEcg = new Array(40).fill(20);

    estadoPoder.pronto = true;
    estadoPoder.ultimoUsoEm = -99999;
    buffEspinafre.ativo = false;
    buffEspinafre.expiraEm = 0;
    elNomePoder.textContent = DEFINICAO_PODERES[loadout.poder].nome.toUpperCase();

    elAvisoRecarga.classList.add("escondido");
    gerarCenario();
    atualizarHud();
    atualizarSlotsArma();
    atualizarHudPoder(performance.now());
  }

  function iniciarJogo() {
    resetarEstado();
    telaInicio.classList.add("escondido");
    telaMorte.classList.add("escondido");
    hud.classList.remove("escondido");
    jogoAtivo = true;
    ultimoFrameTs = performance.now();
    requestAnimationFrame(loop);
  }

  // ----------------------------------------------------------
  // MENU — navegação entre painéis (principal / skin / armas / poderes)
  // ----------------------------------------------------------
  const PAINEIS_MENU = {
    menu: painelMenuPrincipal,
    skin: painelSkin,
    armas: painelArmas,
    poderes: painelPoderes
  };

  function mostrarPainelMenu(nome) {
    Object.values(PAINEIS_MENU).forEach(p => p.classList.add("escondido"));
    PAINEIS_MENU[nome].classList.remove("escondido");
  }

  btnAbrirSkin.addEventListener("click", () => { renderizarGradeSkins(); mostrarPainelMenu("skin"); });
  btnAbrirArmas.addEventListener("click", () => { renderizarGradeArmas(); mostrarPainelMenu("armas"); });
  btnAbrirPoderes.addEventListener("click", () => { renderizarGradePoderes(); mostrarPainelMenu("poderes"); });

  document.querySelectorAll("[data-voltar]").forEach(btn => {
    btn.addEventListener("click", () => mostrarPainelMenu(btn.dataset.voltar));
  });

  // --- Renderização do grid de skins ---
  function renderizarGradeSkins() {
    elGradeSkins.innerHTML = "";
    ORDEM_SKINS.forEach(chave => {
      const def = DEFINICAO_SKINS[chave];
      const cartao = document.createElement("div");
      cartao.className = "cartao-skin" + (loadout.skin === chave ? " selecionada" : "");

      const previa = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      previa.setAttribute("viewBox", "0 0 60 60");
      previa.setAttribute("width", "60");
      previa.setAttribute("height", "60");
      previa.innerHTML = montarPreviaSkinSvg(chave);

      const wrapPrevia = document.createElement("div");
      wrapPrevia.className = "cartao-skin-prevista";
      wrapPrevia.appendChild(previa);

      const nome = document.createElement("div");
      nome.className = "cartao-skin-nome";
      nome.textContent = def.nome;

      const desc = document.createElement("div");
      desc.className = "cartao-skin-desc";
      desc.textContent = def.descricao;

      cartao.appendChild(wrapPrevia);
      cartao.appendChild(nome);
      cartao.appendChild(desc);

      if (loadout.skin === chave) {
        const selo = document.createElement("div");
        selo.className = "selo-equipado";
        selo.textContent = "EQUIPADO";
        cartao.appendChild(selo);
      }

      cartao.addEventListener("click", () => {
        loadout.skin = chave;
        elResumoSkin.textContent = def.nome;
        renderizarGradeSkins();
      });

      elGradeSkins.appendChild(cartao);
    });
  }

  // gera uma pequena prévia SVG simplificada de cada skin para o cartão de seleção
  function montarPreviaSkinSvg(chave) {
    if (chave === "medico") {
      return `
        <circle cx="30" cy="32" r="20" fill="#d8d4c0" stroke="#1a1a17" stroke-width="2"/>
        <path d="M30 12 A20 20 0 0 1 50 32 L10 32 A20 20 0 0 1 30 12 Z" fill="#8fb8a8"/>
        <ellipse cx="30" cy="34" rx="9" ry="6" fill="#bcd4c4" stroke="#1a1a17" stroke-width="1"/>
      `;
    }
    if (chave === "robo") {
      return `
        <circle cx="30" cy="32" r="20" fill="#7a8088" stroke="#1a1a17" stroke-width="2"/>
        <path d="M30 12 A20 20 0 0 1 50 32 L10 32 A20 20 0 0 1 30 12 Z" fill="#3a4248"/>
        <rect x="14" y="26" width="32" height="3" fill="#7ad4ff"/>
        <circle cx="30" cy="38" r="3" fill="#7ad4ff"/>
        <line x1="30" y1="12" x2="30" y2="4" stroke="#3a4248" stroke-width="2"/>
        <circle cx="30" cy="4" r="2" fill="#ff5a3d"/>
      `;
    }
    // militar (padrão)
    return `
      <circle cx="30" cy="32" r="20" fill="#4a5a40" stroke="#1a1a17" stroke-width="2"/>
      <path d="M30 12 A20 20 0 0 1 50 32 L10 32 A20 20 0 0 1 30 12 Z" fill="#3a4632"/>
      <line x1="13" y1="31" x2="47" y2="31" stroke="#6f5a3a" stroke-width="2"/>
      <line x1="26" y1="38" x2="26" y2="46" stroke="#b53030" stroke-width="2"/>
      <line x1="22" y1="42" x2="30" y2="42" stroke="#b53030" stroke-width="2"/>
    `;
  }

  // --- Renderização do grid de armas (seleção de exatamente 3) ---
  function renderizarGradeArmas() {
    elGradeArmas.innerHTML = "";
    Object.keys(DEFINICAO_ARMAS).forEach(chave => {
      const def = DEFINICAO_ARMAS[chave];
      const indiceSelecionado = loadout.armasSelecionadas.indexOf(chave);
      const estaSelecionada = indiceSelecionado !== -1;

      const cartao = document.createElement("div");
      cartao.className = "cartao-arma" + (estaSelecionada ? " selecionada" : "");

      const categoria = document.createElement("div");
      categoria.className = "cartao-arma-categoria";
      categoria.textContent = def.categoria;

      const nome = document.createElement("div");
      nome.className = "cartao-arma-nome";
      nome.textContent = def.nome;

      const stats = document.createElement("div");
      stats.className = "cartao-arma-stats";
      stats.innerHTML = `<span>DANO ${def.dano}</span><span>·</span><span>${def.municaoMax} TIROS</span>`;

      cartao.appendChild(categoria);
      cartao.appendChild(nome);
      cartao.appendChild(stats);

      if (estaSelecionada) {
        const numero = document.createElement("div");
        numero.className = "numero-slot-escolhido";
        numero.textContent = indiceSelecionado + 1;
        cartao.appendChild(numero);
      }

      cartao.addEventListener("click", () => alternarSelecaoArma(chave));
      elGradeArmas.appendChild(cartao);
    });

    elContadorArmasSelecionadas.textContent = loadout.armasSelecionadas.length;
  }

  function alternarSelecaoArma(chave) {
    const indice = loadout.armasSelecionadas.indexOf(chave);
    if (indice !== -1) {
      // já selecionada: remove (precisa manter ao menos 1 arma escolhida)
      if (loadout.armasSelecionadas.length > 1) {
        loadout.armasSelecionadas.splice(indice, 1);
      }
    } else if (loadout.armasSelecionadas.length < 3) {
      // ainda há espaço livre entre os 3 slots
      loadout.armasSelecionadas.push(chave);
    } else {
      // os 3 slots já estão ocupados: a nova escolha substitui a mais antiga (fila)
      loadout.armasSelecionadas.shift();
      loadout.armasSelecionadas.push(chave);
    }
    elResumoArmas.textContent = `${loadout.armasSelecionadas.length}/3 escolhidas`;
    renderizarGradeArmas();
  }

  // --- Renderização do grid de poderes ---
  function renderizarGradePoderes() {
    elGradePoderes.innerHTML = "";
    ORDEM_PODERES.forEach(chave => {
      const def = DEFINICAO_PODERES[chave];
      const cartao = document.createElement("div");
      cartao.className = "cartao-poder" + (loadout.poder === chave ? " selecionada" : "");

      const icone = document.createElement("div");
      icone.className = "cartao-poder-icone";
      icone.textContent = def.icone;

      const nome = document.createElement("div");
      nome.className = "cartao-poder-nome";
      nome.textContent = def.nome;

      const desc = document.createElement("div");
      desc.className = "cartao-poder-desc";
      desc.textContent = def.descricao;

      cartao.appendChild(icone);
      cartao.appendChild(nome);
      cartao.appendChild(desc);

      cartao.addEventListener("click", () => {
        loadout.poder = chave;
        elResumoPoder.textContent = def.nome;
        renderizarGradePoderes();
      });

      elGradePoderes.appendChild(cartao);
    });
  }

  // ----------------------------------------------------------
  // EVENTOS DE ENTRADA
  // ----------------------------------------------------------
  window.addEventListener("keydown", (e) => {
    const tecla = e.key.toLowerCase();
    teclasPressionadas[tecla] = true;

    if (!jogoAtivo) return;

    if (tecla === "r") {
      tentarRecarregar();
    }

    if (tecla === "q") {
      usarPoderAtivo(agora());
    }

    // 1-3: acesso direto às 3 armas escolhidas no menu
    if (/^[1-3]$/.test(tecla)) {
      const indiceDesejado = parseInt(tecla, 10) - 1;
      const chave = loadout.armasSelecionadas[indiceDesejado];
      if (chave) trocarArma(chave);
    }

    // [ e ] navegam o inventário completo, uma arma por vez
    if (tecla === "[") {
      navegarInventario(-1);
    }
    if (tecla === "]") {
      navegarInventario(1);
    }
  });

  window.addEventListener("keyup", (e) => {
    teclasPressionadas[e.key.toLowerCase()] = false;
  });

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  window.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    teclasPressionadas["mouse"] = true;
    if (jogoAtivo) {
      const def = DEFINICAO_ARMAS[jogador.armaAtual];
      if (!def.automatica) {
        tentarAtirar(agora());
      }
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    teclasPressionadas["mouse"] = false;
  });

  window.addEventListener("wheel", (e) => {
    if (!jogoAtivo) return;
    navegarInventario(e.deltaY > 0 ? 1 : -1);
  });

  // previne menu de contexto ao clicar com botão direito (caso usado futuramente)
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  btnIniciar.addEventListener("click", iniciarJogo);
  btnReiniciar.addEventListener("click", iniciarJogo);

  // ----------------------------------------------------------
  // CONTROLES DE TOQUE (MOBILE) — dois manches virtuais + botões
  // ----------------------------------------------------------
  const ehDispositivoToque = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  if (ehDispositivoToque) {
    document.body.classList.add("dispositivo-toque");
  }

  const RAIO_MANCHE = 45; // deslocamento máximo (px) do manche a partir do centro

  // --- manche esquerdo: movimento (equivalente analógico do WASD) ---
  const zonaMovimento     = document.getElementById("zona-joystick-movimento");
  const baseMovimento     = document.getElementById("base-joystick-movimento");
  const manivelaMovimento = document.getElementById("manivela-joystick-movimento");
  let idToqueMovimento = null;
  let centroMovimentoX = 0, centroMovimentoY = 0;

  function moverManivela(elManivela, dx, dy) {
    elManivela.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function iniciarToqueMovimento(toque) {
    idToqueMovimento = toque.identifier;
    const rect = baseMovimento.getBoundingClientRect();
    centroMovimentoX = rect.left + rect.width / 2;
    centroMovimentoY = rect.top + rect.height / 2;
    atualizarToqueMovimento(toque);
  }

  function atualizarToqueMovimento(toque) {
    const dx = toque.clientX - centroMovimentoX;
    const dy = toque.clientY - centroMovimentoY;
    const dist = Math.hypot(dx, dy);
    const distLimitada = Math.min(dist, RAIO_MANCHE);
    const angulo = Math.atan2(dy, dx);
    const kx = Math.cos(angulo) * distLimitada;
    const ky = Math.sin(angulo) * distLimitada;
    moverManivela(manivelaMovimento, kx, ky);
    toqueMovimentoX = kx / RAIO_MANCHE;
    toqueMovimentoY = ky / RAIO_MANCHE;
  }

  function finalizarToqueMovimento() {
    idToqueMovimento = null;
    toqueMovimentoX = 0;
    toqueMovimentoY = 0;
    moverManivela(manivelaMovimento, 0, 0);
  }

  zonaMovimento.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (idToqueMovimento !== null) return;
    iniciarToqueMovimento(e.changedTouches[0]);
  }, { passive: false });

  zonaMovimento.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const toque of e.changedTouches) {
      if (toque.identifier === idToqueMovimento) atualizarToqueMovimento(toque);
    }
  }, { passive: false });

  function finalizarSeForToqueMovimento(e) {
    for (const toque of e.changedTouches) {
      if (toque.identifier === idToqueMovimento) finalizarToqueMovimento();
    }
  }
  zonaMovimento.addEventListener("touchend", finalizarSeForToqueMovimento);
  zonaMovimento.addEventListener("touchcancel", finalizarSeForToqueMovimento);

  // --- manche direito: mira + tiro contínuo (equivalente do mouse) ---
  const zonaMira     = document.getElementById("zona-joystick-mira");
  const baseMira     = document.getElementById("base-joystick-mira");
  const manivelaMira = document.getElementById("manivela-joystick-mira");
  let idToqueMira = null;
  let centroMiraX = 0, centroMiraY = 0;

  function dispararSeNaoAutomatica() {
    if (!jogoAtivo) return;
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    if (!def.automatica) {
      tentarAtirar(agora());
    }
  }

  function iniciarToqueMira(toque) {
    idToqueMira = toque.identifier;
    const rect = baseMira.getBoundingClientRect();
    centroMiraX = rect.left + rect.width / 2;
    centroMiraY = rect.top + rect.height / 2;
    teclasPressionadas["mouse"] = true;
    dispararSeNaoAutomatica();
  }

  function atualizarToqueMira(toque) {
    const dx = toque.clientX - centroMiraX;
    const dy = toque.clientY - centroMiraY;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return; // ignora tremores mínimos, mantém a última direção mirada
    const distLimitada = Math.min(dist, RAIO_MANCHE);
    const angulo = Math.atan2(dy, dx);
    moverManivela(manivelaMira, Math.cos(angulo) * distLimitada, Math.sin(angulo) * distLimitada);

    // só a direção importa (tentarAtirar usa atan2), então projeta a mira
    // bem à frente do jogador na direção do manche
    if (jogoAtivo) {
      mouseX = jogador.x + Math.cos(angulo) * 400;
      mouseY = jogador.y + Math.sin(angulo) * 400;
    }
  }

  function finalizarToqueMira() {
    idToqueMira = null;
    teclasPressionadas["mouse"] = false;
    moverManivela(manivelaMira, 0, 0);
  }

  zonaMira.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (idToqueMira !== null) return;
    iniciarToqueMira(e.changedTouches[0]);
  }, { passive: false });

  zonaMira.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const toque of e.changedTouches) {
      if (toque.identifier === idToqueMira) atualizarToqueMira(toque);
    }
  }, { passive: false });

  function finalizarSeForToqueMira(e) {
    for (const toque of e.changedTouches) {
      if (toque.identifier === idToqueMira) finalizarToqueMira();
    }
  }
  zonaMira.addEventListener("touchend", finalizarSeForToqueMira);
  zonaMira.addEventListener("touchcancel", finalizarSeForToqueMira);

  // --- botões de ação: recarregar (R) e poder ativo (Q) ---
  function ligarBotaoToque(el, handler) {
    el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handler();
    }, { passive: false });
    // mantém o click funcionando também para mouse/trackpad em telas híbridas
    el.addEventListener("click", handler);
  }

  ligarBotaoToque(document.getElementById("btn-toque-recarregar"), () => {
    if (jogoAtivo) tentarRecarregar();
  });
  ligarBotaoToque(document.getElementById("btn-toque-poder"), () => {
    if (jogoAtivo) usarPoderAtivo(agora());
  });

  // --- botão ATIRAR dedicado (mobile) ---
  const btnTouqueAtirar = document.getElementById("btn-toque-atirar");

  btnTouqueAtirar.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!jogoAtivo) return;
    teclasPressionadas["mouse"] = true;
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    if (!def.automatica) {
      tentarAtirar(agora());
    }
  }, { passive: false });

  btnTouqueAtirar.addEventListener("touchend", (e) => {
    e.preventDefault();
    // só desativa o tiro se o joystick de mira também não estiver ativo
    if (idToqueMira === null) teclasPressionadas["mouse"] = false;
  }, { passive: false });

  btnTouqueAtirar.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    if (idToqueMira === null) teclasPressionadas["mouse"] = false;
  }, { passive: false });

  // fallback click para telas híbridas
  btnTouqueAtirar.addEventListener("click", () => {
    if (!jogoAtivo) return;
    const def = DEFINICAO_ARMAS[jogador.armaAtual];
    if (!def.automatica) tentarAtirar(agora());
  });

  // --- setas/slots da barra de inventário também viram tocáveis ---
  document.getElementById("seta-anterior").addEventListener("click", () => { if (jogoAtivo) navegarInventario(-1); });
  document.getElementById("seta-proxima").addEventListener("click", () => { if (jogoAtivo) navegarInventario(1); });
  document.getElementById("slot-anterior").addEventListener("click", () => { if (jogoAtivo) navegarInventario(-1); });
  document.getElementById("slot-proximo").addEventListener("click", () => { if (jogoAtivo) navegarInventario(1); });

  // estado inicial visual do cenário (antes de iniciar)
  gerarCenario();
  desenharCenario();

})();
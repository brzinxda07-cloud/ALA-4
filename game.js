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
  // PERSISTÊNCIA — banco de moedas acumulado entre partidas
  // guardado no localStorage do navegador; sobrevive a morte,
  // reinício e fechar/reabrir a página
  // ----------------------------------------------------------
  const CHAVE_BANCO_MOEDAS = "ala4_banco_moedas";

  function carregarBancoMoedas() {
    try {
      const valor = parseInt(localStorage.getItem(CHAVE_BANCO_MOEDAS), 10);
      return Number.isFinite(valor) && valor >= 0 ? valor : 0;
    } catch (e) {
      // localStorage indisponível (ex.: modo privado/navegador bloqueando) — segue sem persistir
      return 0;
    }
  }

  function salvarBancoMoedas() {
    try {
      localStorage.setItem(CHAVE_BANCO_MOEDAS, String(bancoMoedas));
    } catch (e) {
      // falha silenciosa: sem localStorage disponível, o jogo continua funcionando normalmente
    }
  }

  let bancoMoedas = carregarBancoMoedas();

  // ----------------------------------------------------------
  // ELEMENTOS DE UI
  // ----------------------------------------------------------
  const telaInicio   = document.getElementById("tela-inicio");
  const telaMorte    = document.getElementById("tela-morte");
  const hud          = document.getElementById("hud");
  const btnIniciar   = document.getElementById("btn-iniciar");
  const btnReiniciar = document.getElementById("btn-reiniciar");
  const btnMenuMorte = document.getElementById("btn-menu-morte");
  const btnMenuHud   = document.getElementById("btn-menu-hud");

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
  const elTextoMoedas   = document.getElementById("texto-moedas");
  const elAvisoNivel    = document.getElementById("aviso-nivel");
  const elNivelFinal    = document.getElementById("nivel-final");
  const elAbatesFinal   = document.getElementById("abates-final");
  const elOndaFinal     = document.getElementById("onda-final");
  const elMoedasFinal   = document.getElementById("moedas-final");

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
  const elTextoMoedasBanco = document.getElementById("texto-moedas-banco");

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
    moedas: 0,
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
  let jogoAtivo = false;
  let tempoDecorridoJogo = 0;
  let ultimoFrameTs = 0;

  // histórico de batimento para o ECG
  let pontosEcg = new Array(40).fill(20);
  let faseEcg = 0;

  // ----------------------------------------------------------
  // CENÁRIO: HOSPITAL ABANDONADO PROCEDURAL — MAPA ESTRUTURADO
  // Salas temáticas, mobiliário, detalhes ambientais, iluminação
  // ----------------------------------------------------------
  let elementosCenario = [];
  let salasCenario = [];

  // Tipos de salas e sua composição visual
  const TIPOS_SALA = {
    corredor: {
      nome: "Corredor",
      cor: "rgba(58, 74, 63, 0.15)",
      detalhes: ["placa", "macas", "rachões", "poças"]
    },
    uti: {
      nome: "UTI",
      cor: "rgba(58, 74, 63, 0.2)",
      detalhes: ["camas", "monitores", "seringas", "tubos"]
    },
    morgue: {
      nome: "Morgue",
      cor: "rgba(74, 30, 30, 0.12)",
      detalhes: ["gavetões", "manchas", "ossos", "silhuetas"]
    },
    sala_cirurgia: {
      nome: "Sala de Cirurgia",
      cor: "rgba(143, 184, 168, 0.1)",
      detalhes: ["mesa_cirurgia", "instrumentos", "sangue_seco", "luzes"]
    },
    almoxarifado: {
      nome: "Almoxarifado",
      cor: "rgba(58, 74, 63, 0.18)",
      detalhes: ["caixas", "prateleiras", "garrafas", "bagunça"]
    }
  };

  function gerarCenario() {
    elementosCenario = [];
    salasCenario = [];
    const largura = canvas.width;
    const altura = canvas.height;

    // GRID DE SALAS — divide tela em áreas 2x2
    const tamSalaX = largura / 2;
    const tamSalaY = altura / 2;
    const tiposSala = Object.keys(TIPOS_SALA);

    for (let sx = 0; sx < 2; sx++) {
      for (let sy = 0; sy < 2; sy++) {
        const x = sx * tamSalaX;
        const y = sy * tamSalaY;
        const tipo = tiposSala[Math.floor(Math.random() * tiposSala.length)];
        const sala = {
          x, y, largura: tamSalaX, altura: tamSalaY, tipo,
          id: `${sx}-${sy}`
        };
        salasCenario.push(sala);

        // Gera elementos específicos da sala
        gerarDetalhesSala(sala);
      }
    }

    // RUÍDO/ATMOSFERA GERAL
    // Manchas de mofo/sangue espalhadas
    for (let i = 0; i < 40; i++) {
      elementosCenario.push({
        tipo: "mancha",
        x: Math.random() * largura,
        y: Math.random() * altura,
        raio: 12 + Math.random() * 45,
        cor: Math.random() > 0.65 
          ? `rgba(74,30,30,${0.15 + Math.random() * 0.2})`
          : `rgba(58,74,63,${0.1 + Math.random() * 0.25})`
      });
    }

    // Fissuras/rachaduras no piso
    for (let i = 0; i < 18; i++) {
      elementosCenario.push({
        tipo: "racha",
        x: Math.random() * largura,
        y: Math.random() * altura,
        comprimento: 25 + Math.random() * 85,
        angulo: Math.random() * Math.PI * 2,
        espessura: Math.random() > 0.7 ? 2.5 : 1.2
      });
    }

    // Trilhas de sangue (caminhos)
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * largura;
      const startY = Math.random() * altura;
      const endX = startX + (Math.random() - 0.5) * 300;
      const endY = startY + (Math.random() - 0.5) * 300;
      elementosCenario.push({
        tipo: "trilha_sangue",
        x1: startX, y1: startY,
        x2: endX, y2: endY,
        espessura: 3 + Math.random() * 2
      });
    }

    // Focos de luz ambiente (sombras)
    for (let i = 0; i < 4; i++) {
      elementosCenario.push({
        tipo: "foco_luz",
        x: Math.random() * largura,
        y: Math.random() * altura,
        raio: 80 + Math.random() * 120
      });
    }
  }

  function gerarDetalhesSala(sala) {
    const def = TIPOS_SALA[sala.tipo];
    const cx = sala.x + sala.largura / 2;
    const cy = sala.y + sala.altura / 2;
    const detalhesSala = def.detalhes || [];

    // Fundo colorido da sala
    elementosCenario.push({
      tipo: "fundo_sala",
      x: sala.x,
      y: sala.y,
      largura: sala.largura,
      altura: sala.altura,
      cor: def.cor
    });

    // Borda/parede da sala
    elementosCenario.push({
      tipo: "parede_sala",
      x: sala.x,
      y: sala.y,
      largura: sala.largura,
      altura: sala.altura
    });

    // Cria detalhes baseado no tipo
    detalhesSala.forEach(detalhe => {
      gerarDetalhe(detalhe, sala);
    });

    // Assinatura visual única por sala
    const seed = sala.id.charCodeAt(0) + sala.id.charCodeAt(2);
    if (seed % 2 === 0) {
      elementosCenario.push({
        tipo: "label_sala",
        x: sala.x + 20,
        y: sala.y + 20,
        texto: def.nome,
        tamanho: 11
      });
    }
  }

  function gerarDetalhe(tipo, sala) {
    const cx = sala.x + sala.largura / 2;
    const cy = sala.y + sala.altura / 2;
    const margin = 40;

    switch (tipo) {
      case "camas": {
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          const x = sala.x + margin + Math.random() * (sala.largura - margin * 2);
          const y = sala.y + margin + Math.random() * (sala.altura - margin * 2);
          elementosCenario.push({
            tipo: "cama_hospital",
            x, y,
            angulo: Math.random() * Math.PI * 2
          });
        }
        break;
      }
      case "macas": {
        for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
          elementosCenario.push({
            tipo: "maca",
            x: sala.x + margin + Math.random() * (sala.largura - margin * 2),
            y: sala.y + margin + Math.random() * (sala.altura - margin * 2),
            angulo: Math.random() * Math.PI * 0.5
          });
        }
        break;
      }
      case "mesa_cirurgia": {
        elementosCenario.push({
          tipo: "mesa_cirurgia",
          x: cx,
          y: cy,
          angulo: Math.random() * Math.PI * 2
        });
        break;
      }
      case "gavetões": {
        for (let i = 0; i < 6; i++) {
          elementosCenario.push({
            tipo: "gaveta_morgue",
            x: sala.x + 60 + (i % 3) * 80,
            y: sala.y + 80 + Math.floor(i / 3) * 100
          });
        }
        break;
      }
      case "caixas": {
        for (let i = 0; i < 8; i++) {
          elementosCenario.push({
            tipo: "caixa",
            x: sala.x + 50 + Math.random() * (sala.largura - 100),
            y: sala.y + 50 + Math.random() * (sala.altura - 100),
            largura: 30 + Math.random() * 40,
            altura: 30 + Math.random() * 40,
            angulo: Math.random() * 0.3
          });
        }
        break;
      }
      case "rachões": {
        for (let i = 0; i < 4; i++) {
          elementosCenario.push({
            tipo: "racha",
            x: sala.x + Math.random() * sala.largura,
            y: sala.y + Math.random() * sala.altura,
            comprimento: 40 + Math.random() * 60,
            angulo: Math.random() * Math.PI * 2,
            espessura: 2
          });
        }
        break;
      }
      case "poças": {
        for (let i = 0; i < 2; i++) {
          elementosCenario.push({
            tipo: "poca",
            x: sala.x + margin + Math.random() * (sala.largura - margin * 2),
            y: sala.y + margin + Math.random() * (sala.altura - margin * 2),
            raio: 20 + Math.random() * 35
          });
        }
        break;
      }
      case "manchas": {
        for (let i = 0; i < 5; i++) {
          elementosCenario.push({
            tipo: "mancha_sangue_grande",
            x: sala.x + margin + Math.random() * (sala.largura - margin * 2),
            y: sala.y + margin + Math.random() * (sala.altura - margin * 2),
            raio: 25 + Math.random() * 40
          });
        }
        break;
      }
      case "placa": {
        elementosCenario.push({
          tipo: "placa_porta",
          x: sala.x + 30,
          y: sala.y + 30,
          texto: Math.random() > 0.5 ? "PERIGO" : "ISOLADO"
        });
        break;
      }
      case "ossos": {
        for (let i = 0; i < 3; i++) {
          elementosCenario.push({
            tipo: "osso",
            x: sala.x + margin + Math.random() * (sala.largura - margin * 2),
            y: sala.y + margin + Math.random() * (sala.altura - margin * 2),
            tamanho: Math.random() > 0.5 ? "pequeno" : "grande",
            angulo: Math.random() * Math.PI * 2
          });
        }
        break;
      }
      case "bagunça": {
        for (let i = 0; i < 4; i++) {
          elementosCenario.push({
            tipo: "entulho",
            x: sala.x + margin + Math.random() * (sala.largura - margin * 2),
            y: sala.y + margin + Math.random() * (sala.altura - margin * 2),
            largura: 20 + Math.random() * 35,
            altura: 15 + Math.random() * 25,
            angulo: Math.random() * Math.PI * 2
          });
        }
        break;
      }
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
    intervaloEntreOndasMs: 50000,
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

  // solta os drops de um zumbi morto: frasco de exp (verde) + moeda (dourada),
  // com um leve deslocamento aleatório entre os dois pra não nascerem sobrepostos
  function soltarDrops(z) {
    pickups.push({ x: z.x, y: z.y, valor: z.dropExp, raio: 7, fase: 0, tipo: "exp" });

    const anguloMoeda = Math.random() * Math.PI * 2;
    pickups.push({
      x: z.x + Math.cos(anguloMoeda) * 10,
      y: z.y + Math.sin(anguloMoeda) * 10,
      valor: z.dropMoedas,
      raio: 6,
      fase: Math.random() * Math.PI * 2,
      tipo: "moeda"
    });
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

    // drop de moedas: começa pequeno e cresce um pouco com o nível, com variação aleatória
    const dropMoedas = 2 + Math.floor((jogador.nivel - 1) / 2) + Math.floor(Math.random() * 3);

    return {
      x, y,
      raio: 15,
      vida: 40 * escalaNivel,
      vidaMax: 40 * escalaNivel,
      velocidade: aleatorioEntre(0.9, 1.6) * (1 + (jogador.nivel - 1) * 0.04),
      dano: 8 * escalaNivel,
      dropExp,
      dropMoedas,
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
    // chefes soltam bem mais moedas que zumbis comuns, escalando com o tier e o nível
    const dropMoedas = 25 + (tierChefe - 1) * 15 + (jogador.nivel - 1) * 3;

    return {
      x, y,
      raio: 40,
      vida: vidaBase,
      vidaMax: vidaBase,
      velocidade: aleatorioEntre(0.55, 0.75) * (1 + (jogador.nivel - 1) * 0.03),
      dano: 26 * escalaNivel,
      dropExp,
      dropMoedas,
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
        soltarDrops(z);
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

  function criarParticulasChama(x, y, vxBase, vyBase) {
    // Criar menos partículas e com menos frequência
    if (particulas.length > 200) return; // limitar pool máximo
    
    const qtd = aleatorioEntre(1, 2); // reduzir de 3-6 para 1-2
    const cores = ["#ff7a1f", "#ff6600", "#ffaa00"];
    
    for (let i = 0; i < qtd; i++) {
      const ang = Math.random() * Math.PI * 2;
      const vel = aleatorioEntre(0.3, 1.5);
      
      particulas.push({
        x, y,
        vx: vxBase * 0.2 + Math.cos(ang) * vel,
        vy: vyBase * 0.2 + Math.sin(ang) * vel,
        vida: aleatorioEntre(0.3, 0.6),
        cor: cores[Math.floor(Math.random() * cores.length)],
        raio: aleatorioEntre(2, 5),
        tipoParticula: "chama"
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
        if (p.tipo === "moeda") {
          ganharMoedas(p.valor);
        } else {
          ganharExp(p.valor);
        }
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

  function ganharMoedas(valor) {
    jogador.moedas += valor;
    bancoMoedas += valor;
    salvarBancoMoedas();
    atualizarCarteiraMenu();
    atualizarHud();
  }

  function atualizarCarteiraMenu() {
    if (elTextoMoedasBanco) elTextoMoedasBanco.textContent = bancoMoedas;
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

        soltarDrops(z);
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
        espinafre: espinafreAtivo,
        tipoArma: jogador.armaAtual,
        frameConta: 0  // contador para otimizar criação de partículas
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
      p.frameConta = (p.frameConta || 0) + 1;

      // criar partículas de chama para lança-chamas (apenas a cada 2 frames)
      if (p.tipoArma === "lanca_chamas" && p.frameConta % 2 === 0) {
        criarParticulasChama(p.x, p.y, p.vx, p.vy);
      }

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

    if (dx !== 0 || dy !== 0) {
      const norm = Math.hypot(dx, dy);
      jogador.x += (dx / norm) * jogador.velocidade;
      jogador.y += (dy / norm) * jogador.velocidade;
    }

    jogador.x = Math.max(jogador.raio, Math.min(canvas.width - jogador.raio, jogador.x));
    jogador.y = Math.max(jogador.raio, Math.min(canvas.height - jogador.raio, jogador.y));
  }

  // ----------------------------------------------------------
  // DESENHO — CENÁRIO
  // ----------------------------------------------------------
  function desenharCenario() {
    // Fundo base do hospital
    ctx.fillStyle = "#1d1f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar elementos em ordem de profundidade
    elementosCenario.forEach(el => {
      if (el.tipo === "fundo_sala") {
        ctx.fillStyle = el.cor;
        ctx.fillRect(el.x, el.y, el.largura, el.altura);
      }
    });

    // Pisos/manchas
    elementosCenario.forEach(el => {
      if (el.tipo === "mancha") {
        ctx.beginPath();
        ctx.fillStyle = el.cor;
        ctx.ellipse(el.x, el.y, el.raio, el.raio * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.tipo === "poca") {
        ctx.beginPath();
        ctx.fillStyle = "rgba(30,20,20,0.35)";
        ctx.ellipse(el.x, el.y, el.raio, el.raio * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(50,30,30,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (el.tipo === "mancha_sangue_grande") {
        ctx.fillStyle = "rgba(122,31,31,0.25)";
        ctx.beginPath();
        ctx.ellipse(el.x, el.y, el.raio, el.raio * 0.7, Math.random() * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Móveis/estruturas
    elementosCenario.forEach(el => {
      if (el.tipo === "cama_hospital") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        // Frame da cama
        ctx.strokeStyle = "#4a5a40";
        ctx.lineWidth = 3;
        ctx.strokeRect(-35, -20, 70, 40);
        // Colchão
        ctx.fillStyle = "rgba(100,80,60,0.6)";
        ctx.fillRect(-32, -16, 64, 32);
        // Barraca lateral
        ctx.strokeStyle = "#3a4a30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-32, -20);
        ctx.lineTo(-32, -35);
        ctx.stroke();
        ctx.restore();
      } else if (el.tipo === "maca") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        ctx.fillStyle = "rgba(140,120,100,0.7)";
        ctx.fillRect(-40, -15, 80, 30);
        ctx.strokeStyle = "#5a4a3a";
        ctx.lineWidth = 2;
        ctx.strokeRect(-40, -15, 80, 30);
        ctx.restore();
      } else if (el.tipo === "mesa_cirurgia") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        // Superfície
        ctx.fillStyle = "rgba(140,150,160,0.6)";
        ctx.fillRect(-50, -30, 100, 60);
        ctx.strokeStyle = "#8fb8a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(-50, -30, 100, 60);
        // Manchas de sangue
        ctx.fillStyle = "rgba(122,31,31,0.4)";
        ctx.fillRect(-20, -10, 40, 20);
        ctx.restore();
      } else if (el.tipo === "caixa") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        ctx.fillStyle = "rgba(100,90,70,0.7)";
        ctx.fillRect(-el.largura / 2, -el.altura / 2, el.largura, el.altura);
        ctx.strokeStyle = "#4a443a";
        ctx.lineWidth = 2;
        ctx.strokeRect(-el.largura / 2, -el.altura / 2, el.largura, el.altura);
        ctx.restore();
      } else if (el.tipo === "gaveta_morgue") {
        // Gavetão da morgue
        ctx.fillStyle = "rgba(60,55,45,0.8)";
        ctx.fillRect(el.x, el.y, 60, 35);
        ctx.strokeStyle = "#3a3a30";
        ctx.lineWidth = 2;
        ctx.strokeRect(el.x, el.y, 60, 35);
        // Maçaneta
        ctx.fillStyle = "#7a7a60";
        ctx.beginPath();
        ctx.arc(el.x + 50, el.y + 17, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.tipo === "entulho") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        ctx.fillStyle = "rgba(50,45,35,0.8)";
        ctx.fillRect(-el.largura / 2, -el.altura / 2, el.largura, el.altura);
        ctx.restore();
      }
    });

    // Detalhes (rachas, trilhas)
    elementosCenario.forEach(el => {
      if (el.tipo === "racha") {
        ctx.strokeStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.2})`;
        ctx.lineWidth = el.espessura || 1.5;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + Math.cos(el.angulo) * el.comprimento, el.y + Math.sin(el.angulo) * el.comprimento);
        ctx.stroke();
      } else if (el.tipo === "trilha_sangue") {
        ctx.strokeStyle = "rgba(122,31,31,0.15)";
        ctx.lineWidth = el.espessura;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      } else if (el.tipo === "osso") {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.angulo);
        ctx.fillStyle = "rgba(200,190,170,0.5)";
        if (el.tamanho === "grande") {
          ctx.fillRect(-25, -4, 50, 8);
          ctx.beginPath();
          ctx.arc(-25, 0, 6, 0, Math.PI * 2);
          ctx.arc(25, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-12, -2, 24, 4);
          ctx.beginPath();
          ctx.arc(-12, 0, 3, 0, Math.PI * 2);
          ctx.arc(12, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (el.tipo === "placa_porta") {
        ctx.fillStyle = "rgba(255,90,61,0.3)";
        ctx.fillRect(el.x, el.y, 50, 40);
        ctx.strokeStyle = "#ff5a3d";
        ctx.lineWidth = 2;
        ctx.strokeRect(el.x, el.y, 50, 40);
        ctx.fillStyle = "#ff5a3d";
        ctx.font = "bold 10px 'Share Tech Mono'";
        ctx.textAlign = "center";
        ctx.fillText(el.texto, el.x + 25, el.y + 25);
      }
    });

    // Paredes e divisões
    elementosCenario.forEach(el => {
      if (el.tipo === "parede_sala") {
        ctx.strokeStyle = "rgba(40,35,25,0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(el.x, el.y, el.largura, el.altura);
      }
    });

    // Labels das salas
    elementosCenario.forEach(el => {
      if (el.tipo === "label_sala") {
        ctx.fillStyle = "rgba(212,207,154,0.2)";
        ctx.font = `${el.tamanho}px 'Share Tech Mono', monospace`;
        ctx.textAlign = "left";
        ctx.fillText(el.texto, el.x, el.y);
      }
    });

    // Focos de luz (vinheta suave das salas)
    elementosCenario.forEach(el => {
      if (el.tipo === "foco_luz") {
        const gradient = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, el.raio);
        gradient.addColorStop(0, "rgba(212,207,154,0.08)");
        gradient.addColorStop(1, "rgba(212,207,154,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.raio, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Grade de azulejos sutil (fundo)
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    const tamanho = 80;
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
      
      // Efeito especial para lança-chamas (otimizado)
      if (p.tipoArma === "lanca_chamas") {
        // Uma única sombra ao invés de múltiplas
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 8;
        
        // Camada externa (aura)
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 170, 0, 0.25)";
        ctx.arc(p.x, p.y, raioDesenho * 2.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Camada média (laranja)
        ctx.beginPath();
        ctx.fillStyle = "#ff7a1f";
        ctx.arc(p.x, p.y, raioDesenho * 1.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo (amarelo)
        ctx.beginPath();
        ctx.fillStyle = "#ffaa00";
        ctx.arc(p.x, p.y, raioDesenho, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      } else {
        // Desenho normal para outras armas
        ctx.beginPath();
        ctx.fillStyle = p.espinafre ? "#6fff8f" : p.cor;
        ctx.shadowColor = p.espinafre ? "#6fff8f" : p.cor;
        ctx.shadowBlur = p.espinafre ? 14 : 6;
        ctx.arc(p.x, p.y, raioDesenho, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  function desenharParticulas() {
    particulas.forEach(p => {
      if (p.tipoParticula === "chama") {
        // Partículas de chama simplificadas (sem dupla camada)
        ctx.beginPath();
        ctx.fillStyle = p.cor;
        ctx.shadowColor = p.cor;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.max(0, p.vida * 0.8);
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else {
        // Partículas normais (sangue)
        ctx.beginPath();
        ctx.fillStyle = p.cor;
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }

  function desenharPickups() {
    pickups.forEach(p => {
      const flutua = Math.sin(p.fase) * 3;

      if (p.tipo === "moeda") {
        // moeda dourada com anel interno, pra diferenciar do frasco de exp
        ctx.beginPath();
        ctx.fillStyle = "#ffcf3a";
        ctx.shadowColor = "#ffcf3a";
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y + flutua, p.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#8a6a10";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = "rgba(138,106,16,0.6)";
        ctx.lineWidth = 1;
        ctx.arc(p.x, p.y + flutua, p.raio * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

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

    // abates e moedas
    elTextoAbates.textContent = jogador.abates;
    elTextoMoedas.textContent = jogador.moedas;
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
    if (elMoedasFinal) elMoedasFinal.textContent = jogador.moedas;
    hud.classList.add("escondido");
    telaMorte.classList.remove("escondido");
  }

  // interrompe a partida em andamento (sem contar como derrota) e volta ao menu principal
  function voltarAoMenu() {
    jogoAtivo = false;
    hud.classList.add("escondido");
    telaMorte.classList.add("escondido");
    telaInicio.classList.remove("escondido");
    mostrarPainelMenu("menu");
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
    jogador.moedas = 0;
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

  // ----------------------------------------------------------
  // PAINEL DE COMPRAS — lógica de intervalo entre ondas
  // ----------------------------------------------------------
  const painelCompras = document.getElementById("painel-compras");
  const btnFecharCompras = document.getElementById("btn-fechar-compras");
  const btnPularOnda = document.getElementById("btn-pular-onda");
  const elMoedasCompras = document.getElementById("moedas-compras");
  const elTempoProximaOnda = document.getElementById("tempo-proxima-onda");

  let intervaloAtualizacaoTempo = null;
  let painelAberto = false;

  function mostrarPainelCompras() {
    if (!painelCompras.classList.contains("escondido")) return;
    painelCompras.classList.remove("escondido");
    painelAberto = true;
    elMoedasCompras.textContent = bancoMoedas;
    
    // esconde botão de pular enquanto painel está aberto
    btnPularOnda.classList.add("escondido");
    
    // inicia contagem regressiva
    intervaloAtualizacaoTempo = setInterval(() => {
      if (ondaInfo.emIntervalo) {
        const restanteMs = Math.max(0, ondaInfo.tempoProximaOndaEm - agora());
        const restanteS = Math.ceil(restanteMs / 1000);
        elTempoProximaOnda.textContent = restanteS;
      }
    }, 100);
  }

  function fecharPainelCompras() {
    painelCompras.classList.add("escondido");
    painelAberto = false;
    
    // mostra botão de pular se estiver em intervalo
    if (ondaInfo.emIntervalo) {
      btnPularOnda.classList.remove("escondido");
    }
    
    if (intervaloAtualizacaoTempo !== null) {
      clearInterval(intervaloAtualizacaoTempo);
      intervaloAtualizacaoTempo = null;
    }
  }

  function pularProximaOnda() {
    // pula para a próxima onda imediatamente
    ondaInfo.tempoProximaOndaEm = agora();
    btnPularOnda.classList.add("escondido");
  }

  btnFecharCompras.addEventListener("click", fecharPainelCompras);
  btnPularOnda.addEventListener("click", pularProximaOnda);

  // ----------------------------------------------------------
  // OVERRIDE DA FUNÇÃO atualizarHudOnda PARA MOSTRAR PAINEL
  // ----------------------------------------------------------
  const atualizarHudOndaOriginal = atualizarHudOnda;
  atualizarHudOnda = function() {
    atualizarHudOndaOriginal();
    
    // Se entrou em intervalo e está em jogo (não no menu), mostra painel
    if (ondaInfo.emIntervalo && !telaInicio.classList.contains("escondido") === false && !telaMorte.classList.contains("escondido") === false) {
      mostrarPainelCompras();
    } else if (!ondaInfo.emIntervalo) {
      // esconde painel e botão quando onda começa
      fecharPainelCompras();
      btnPularOnda.classList.add("escondido");
    }
  };

  btnIniciar.addEventListener("click", iniciarJogo);
  btnReiniciar.addEventListener("click", iniciarJogo);
  btnMenuMorte.addEventListener("click", voltarAoMenu);
  btnMenuHud.addEventListener("click", voltarAoMenu);

  // estado inicial visual do cenário (antes de iniciar)
  gerarCenario();
  desenharCenario();
  atualizarCarteiraMenu();

})();
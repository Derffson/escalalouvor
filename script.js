const API_URL = "https://sheetdb.io/api/v1/w34uix9m94kl8";

document.getElementById("escalaForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.target;

  const novaEscala = {
    data: form.dataEscala.value,
    vocal: form.vocal.value.trim(),
    segundaVoz: form.segundaVoz.value.trim(),
    baterista: form.baterista.value.trim(),
    guitarrista: form.guitarrista.value.trim(),
    baixista: form.baixista.value.trim(),
    tecladista: form.tecladista.value.trim(),
    violonista: form.violonista.value.trim(),
    paleta: form.paleta.value.trim(),
  };

  if (!novaEscala.data) {
    alert("Informe a data da escala.");
    return;
  }

  try {
    await fetch(`${API_URL}/data/data/${encodeURIComponent(novaEscala.data)}`, {
      method: "DELETE",
    });

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data: [novaEscala] }),
      headers: { "Content-Type": "application/json" },
    });

    alert("Escala salva com sucesso!");
    form.reset();
    atualizarCalendario();
  } catch (error) {
    alert("Erro ao salvar escala.");
    console.error(error);
  }
});

document.getElementById("formAviso").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.target;
  const avisoTexto = form.aviso.value.trim();

  if (!avisoTexto) {
    alert("Digite um aviso antes de salvar.");
    return;
  }

  try {
    // Apaga todos os avisos antigos (caso queira manter apenas o último)
    const resAvisos = await fetch(API_URL);
    const avisos = await resAvisos.json();

    // Deleta todos os avisos que existirem (apenas da aba "avisos")
    for (const aviso of avisos) {
      if (aviso.aviso) {
        await fetch(`${API_URL}/data/aviso/${encodeURIComponent(aviso.aviso)}`, {
          method: "DELETE",
        });
      }
    }

    // Adiciona o novo aviso
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data: [{ aviso: avisoTexto }] }),
      headers: { "Content-Type": "application/json" },
    });

    alert("Aviso salvo com sucesso!");
    form.reset();
    carregarAviso();
  } catch (error) {
    alert("Erro ao salvar aviso.");
    console.error(error);
  }
});

async function carregarAviso() {
  try {
    const res = await fetch(API_URL);
    const dados = await res.json();
    const avisos = dados.filter(d => d.aviso);
    if (avisos.length === 0) {
      document.getElementById("avisoDisplayTexto").textContent = "Nenhum aviso cadastrado.";
      return;
    }
    // Pega o último aviso cadastrado
    const ultimo = avisos[avisos.length - 1];
    document.getElementById("avisoDisplayTexto").textContent = ultimo.aviso;
  } catch (error) {
    console.error("Erro ao carregar aviso:", error);
    document.getElementById("avisoDisplayTexto").textContent = "Erro ao carregar aviso.";
  }
}

async function buscarEscala() {
  const data = document.getElementById("dataBusca").value;
  if (!data) {
    alert("Selecione uma data para buscar.");
    return;
  }
  mostrarEscala(data);
}

async function mostrarEscala(data) {
  const container = document.getElementById("escalaSalva");

  try {
    const res = await fetch(`${API_URL}/search?data=${encodeURIComponent(data)}`);
    const escalas = await res.json();
    const dados = escalas[0];

    if (!dados) {
      container.innerHTML = `<p><strong>Nenhuma escala cadastrada para ${data}.</strong></p>`;
      return;
    }

    const isAdmin = document.getElementById("areaAdmin").style.display === "block";

    container.innerHTML = `
      <h2>Escala da Semana (${data})</h2>
      <p><strong>Vocal:</strong> ${dados.vocal || ''}</p>
      <p><strong>Segunda Voz:</strong> ${dados.segundaVoz || ''}</p>
      <p><strong>Baterista:</strong> ${dados.baterista || ''}</p>
      <p><strong>Guitarrista:</strong> ${dados.guitarrista || ''}</p>
      <p><strong>Baixista:</strong> ${dados.baixista || ''}</p>
      <p><strong>Tecladista:</strong> ${dados.tecladista || ''}</p>
      <p><strong>Violonista:</strong> ${dados.violonista || ''}</p>
      <p><strong>Paleta de Cores:</strong> ${dados.paleta || ''}</p>

      ${isAdmin ? `
        <button onclick="editarEscala('${data}')">Editar</button>
        <button class="botao-secundario" onclick="excluirEscala('${data}')">Excluir</button>
      ` : ''}
    `;
  } catch (error) {
    console.error("Erro ao buscar escala:", error);
    container.innerHTML = "<p>Erro ao carregar escala.</p>";
  }
}

async function editarEscala(data) {
  const res = await fetch(`${API_URL}/search?data=${encodeURIComponent(data)}`);
  const dados = (await res.json())[0];
  if (!dados) return alert("Escala não encontrada.");

  const form = document.getElementById("escalaForm");
  form.dataEscala.value = data;
  form.vocal.value = dados.vocal || '';
  form.segundaVoz.value = dados.segundaVoz || '';
  form.baterista.value = dados.baterista || '';
  form.guitarrista.value = dados.guitarrista || '';
  form.baixista.value = dados.baixista || '';
  form.tecladista.value = dados.tecladista || '';
  form.violonista.value = dados.violonista || '';
  form.paleta.value = dados.paleta || '';

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirEscala(data) {
  if (!confirm(`Tem certeza que deseja excluir a escala do dia ${data}?`)) return;

  try {
    const res = await fetch(`${API_URL}/data/data/${encodeURIComponent(data)}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Falha ao excluir escala");

    document.getElementById("escalaSalva").innerHTML = "";
    atualizarCalendario();
    alert("Escala excluída com sucesso!");
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir a escala.");
  }
}

let calendar;

document.addEventListener("DOMContentLoaded", () => {
  iniciarCalendario();
  carregarAviso();
});

async function iniciarCalendario() {
  const calendarEl = document.getElementById("calendario");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    events: await gerarEventos(),
    eventClick: function (info) {
      const data = info.event.startStr;
      mostrarEscala(data);
      document.getElementById("dataBusca").value = data;
    },
  });
  calendar.render();
}

async function gerarEventos() {
  const res = await fetch(API_URL);
  const dados = await res.json();
  return dados
    .filter(e => e.data)  // somente registros que tenham data (escala)
    .map((escala) => ({
      title: "Escala",
      start: escala.data,
      backgroundColor: "#3a87ad",
      borderColor: "#3a87ad",
    }));
}

function atualizarCalendario() {
  if (!calendar) return;
  calendar.removeAllEvents();
  gerarEventos().then((eventos) => {
    calendar.addEventSource(eventos);
    calendar.refetchEvents();
  });
}

function ativarModoAdmin() {
  const senha = prompt("Digite a senha de administrador:");
  if (senha === "louvor2024") {
    document.getElementById("areaAdmin").style.display = "block";
    document.getElementById("btnAdmin").style.display = "none";
    atualizarCalendario();
  } else {
    alert("Senha incorreta.");
  }
}

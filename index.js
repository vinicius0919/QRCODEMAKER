const tipo = document.getElementById("tipo");
const form = document.getElementById("form");
// const existingImg = document.getElementById("qr-code");
const qrCodeContainer = document.getElementById("qr-code-container");
const downloadBtn = document.getElementById("download");

const selectTypeWifi = document.getElementById("tipo_criptografia");
const inputSenha = document.getElementById("senha");

const inputs = document.querySelectorAll("input");
// verifica se o input tem valor
// se tiver, adiciona a classe 'filled' para manter o placeholder flutuando
inputs.forEach((input) => {
  input.addEventListener("input", () => {
    if (input.value) {
      input.classList.add("filled");
      const existingImg = qrCodeContainer.querySelector("img");
      if (existingImg) {
        qrCodeContainer.removeChild(existingImg);
        downloadBtn.disabled = true;
      }
    } else {
      input.classList.remove("filled");
    }
  });
});

selectTypeWifi.addEventListener("change", (event) => {
  const selectedValue = event.target.value;

  if (selectedValue === "unencrypted") {
    // hidden input and span
    inputSenha.classList.add("hidden");
    span = document.querySelector('span[for="senha"]');
    span.classList.add("hidden");
    inputSenha.value = "";
  } else {
    span = document.querySelector('span[for="senha"]');
    span.classList.remove("hidden");
    inputSenha.classList.remove("hidden");
  }
});

const image1 = document.getElementsByClassName("image-1")[0];
const image2 = document.getElementsByClassName("image-2")[0];
const image3 = document.getElementsByClassName("image-3")[0];

// execute display none one time at start
image1.style.display = "none";
image2.style.display = "none";
image3.style.display = "none";

let counter = 0;

setInterval(() => {
  image1.style.display = counter === 0 ? "" : "none";
  image2.style.display = counter === 1 ? "" : "none";
  image3.style.display = counter === 2 ? "" : "none";
  counter = (counter + 1) % 3;
}, 4000);

const QRCodeFormats = {
  texto: (conteudo) => {
    return `${conteudo}`;
  },

  url: (link) => {
    return `${link}`;
  },

  wifi: ({ ssid, password, encryption = "WPA", hidden = false }) => {
    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 1 : 0};;`;
  },

  contato: ({ nome, sobrenome, empresa, telefone, email }) => {
    return `
BEGIN:VCARD
VERSION:3.0
N:${sobrenome};${nome};;;
FN:${nome} ${sobrenome}
ORG:${empresa}
TEL;TYPE=WORK,VOICE:${telefone}
EMAIL:${email}
END:VCARD`.trim();
  },

  sms: ({ telefone, mensagem }) => {
    return `SMSTO:${telefone}:${mensagem}`;
  },

  email: ({ endereco, assunto = "", corpo = "" }) => {
    return `mailto:${endereco}?subject=${encodeURIComponent(
      assunto
    )}&body=${encodeURIComponent(corpo)}`;
  },

  telefone: (numero) => {
    return `tel:${numero}`;
  },
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const dados = Object.fromEntries(formData);
  const tipoSelecionado = dados.tipo;

  let qrCodeData;

  try {
    switch (tipoSelecionado) {
      case "texto":
      case "url":
      case "telefone":
        qrCodeData = QRCodeFormats[tipoSelecionado](dados[tipoSelecionado]);
        break;

      case "wifi":
        qrCodeData = QRCodeFormats.wifi({
          ssid: dados.ssid,
          password: dados.senha,
          encryption: dados.tipo_criptografia || "WPA",
          hidden: dados.escondido === "on",
        });
        break;

      case "contato":
        qrCodeData = QRCodeFormats.contato({
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          empresa: dados.empresa,
          telefone: dados.telefone,
          email: dados.email,
        });
        break;

      case "sms":
        qrCodeData = QRCodeFormats.sms({
          telefone: dados.telefone,
          mensagem: dados.mensagem,
        });
        break;

      case "email":
        qrCodeData = QRCodeFormats.email({
          endereco: dados.email,
          assunto: dados.assunto,
          corpo: dados.corpo,
        });
        break;

      default:
        throw new Error("Tipo de QR Code não reconhecido.");
    }

    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      qrCodeData
    )}`;

    // Aqui você pode exibir a imagem do QR code em um <img>
    const qrCodeImg = document.createElement("img");
    qrCodeImg.src = qrCodeURL;
    qrCodeImg.alt = "QR Code gerado";
    qrCodeContainer.appendChild(qrCodeImg);
    downloadBtn.disabled = false;
  } catch (err) {
    console.error("Erro ao gerar QR Code:", err);
  }
});

// select event listener

tipo.addEventListener("change", (event) => {
  const tipoSelecionado = event.target.value;

  // Esconde todos os campos
  document.querySelectorAll(".fields").forEach((div) => {
    div.classList.add("hidden");
    div.classList.remove("active");
    // remove required from all inputs inside the hidden div
    const inputsEscondidos = div.querySelectorAll("input");
    inputsEscondidos.forEach((input) => {
      input.required = false;
    });
  });

  // Mostra os campos correspondentes ao tipo selecionado
  const camposParaMostrar = document.getElementById(
    `${tipoSelecionado}-fields`
  );
  if (camposParaMostrar) {
    camposParaMostrar.classList.remove("hidden");
    camposParaMostrar.classList.add("active");
    // add required to all inputs inside the active div
    const inputsAtivos = camposParaMostrar.querySelectorAll("input");
    inputsAtivos.forEach((input) => {
      input.required = true;
    });
  }
});

downloadBtn.addEventListener("click", async () => {
  const existingImg = qrCodeContainer.querySelector("img");
  if (existingImg && existingImg.src) {
    try {
      const response = await fetch(existingImg.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar memória do blob
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error);
    }
  } else {
    downloadBtn.disabled = true;
  }
});

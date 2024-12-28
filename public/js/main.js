const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('logo');
const previewLogo = document.getElementById('preview-logo');
const removeLogoBtn = document.querySelector('.remove-logo');
let logoFile = null;

// Drag & Drop Events
dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropArea.classList.add('dragging');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('dragging');
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  dropArea.classList.remove('dragging');
  handleFile(event.dataTransfer.files[0]);
});

dropArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  handleFile(event.target.files[0]);
});

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file.');
    return;
  }

  logoFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    previewLogo.src = reader.result;
    previewLogo.classList.remove('d-none');
    removeLogoBtn.classList.remove('d-none');
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  logoFile = null;
  previewLogo.classList.add('d-none');
  removeLogoBtn.classList.add('d-none');
  previewLogo.src = '';
  fileInput.value = '';
}

// QR Code Generation
document.getElementById('qr-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const link = document.getElementById('link').value;

  if (!link) {
    alert('Please provide a valid link.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('link', link);
    
    if (logoFile) {
      const logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(logoFile);
      });
      formData.append('logo', logoDataUrl);
    }

    const response = await fetch('/api/generate-qr', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    const blob = await response.blob();
    const qrImage = document.getElementById('qr-image');
    const downloadLink = document.getElementById('download-qr');
    
    qrImage.src = URL.createObjectURL(blob);
    downloadLink.href = qrImage.src;

    document.getElementById('qr-result').classList.remove('d-none');
    document.getElementById('qr-form').classList.add('d-none');
  } catch (err) {
    alert('Error generating QR Code: ' + err.message);
  }
});

function resetForm() {
  document.getElementById('qr-form').reset();
  document.getElementById('qr-form').classList.remove('d-none');
  document.getElementById('qr-result').classList.add('d-none');
  removeLogo();
}


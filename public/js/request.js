document.getElementById('requestForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    clientName: document.getElementById('clientName').value,
    clientPhone: document.getElementById('clientPhone').value,
    clientEmail: document.getElementById('clientEmail').value,
    purpose: document.getElementById('purpose').value,
    propertyType: document.getElementById('propertyType').value,
    address: document.getElementById('address').value,
    ownerName: document.getElementById('ownerName').value,
    detail: document.getElementById('detail').value
  };

  try {
    const response = await fetch('/api/appraisal-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('resultMessage').innerText = 
        `접수가 정상 완료되었습니다.\n접수번호: ${result.applicationNo}`;
      document.getElementById('resultModal').classList.remove('hidden');
      document.getElementById('requestForm').reset();
    } else {
      alert('접수 실패: ' + result.message);
    }
  } catch (err) {
    alert('서버통신 중 오류가 발생했습니다.');
  }
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.add('hidden');
});
async function fetchRequests() {
  const status = document.getElementById('statusFilter').value;
  let url = '/api/admin/requests';
  if (status) url += `?status=${encodeURIComponent(status)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      renderTable(data.data);
    }
  } catch (err) {
    console.error('데이터 로드 실패:', err);
  }
}

function renderTable(list) {
  const tbody = document.getElementById('requestTableBody');
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">접수된 의뢰가 없습니다.</td></tr>';
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.application_no}</strong></td>
      <td>${item.client_name}</td>
      <td>${item.client_phone}</td>
      <td>${item.property_type}</td>
      <td>${item.address}</td>
      <td><span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span></td>
      <td>${new Date(item.created_at).toLocaleString('ko-KR')}</td>
      <td>
        <select onchange="updateStatus(${item.id}, this.value)">
          <option value="">상태변경</option>
          <option value="접수완료">접수완료</option>
          <option value="검토중">검토중</option>
          <option value="담당배정">담당배정</option>
          <option value="평가완료">평가완료</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case '접수완료': return 'bg-blue';
    case '검토중': return 'bg-orange';
    case '담당배정': return 'bg-purple';
    case '평가완료': return 'bg-green';
    default: return 'bg-gray';
  }
}

async function updateStatus(id, newStatus) {
  if (!newStatus) return;
  if (!confirm(`의뢰 상태를 [${newStatus}](으)로 변경하시겠습니까?`)) return;

  try {
    const res = await fetch(`/api/admin/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();

    if (result.success) {
      alert('상태가 변경되고 고객에게 문자가 발송되었습니다.');
      fetchRequests();
    } else {
      alert('변경 실패: ' + result.message);
    }
  } catch (err) {
    alert('통신 실패');
  }
}

document.getElementById('statusFilter').addEventListener('change', fetchRequests);
document.getElementById('refreshBtn').addEventListener('click', fetchRequests);

// 초기로딩
fetchRequests();
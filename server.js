const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // public 폴더 정적 파일 제공

// 파일 업로드 설정 (uploads 폴더 저장)
const upload = multer({ dest: 'uploads/' });

// 2. 임시 데이터 저장소 (DB 연동 전 메모리 저장용)
let appraisalRequests = []; // 감정평가 의뢰 목록
let qnaList = [];           // 1:1 고객 문의 목록

// ==========================================
// [API 1] 감정평가 예상 수수료 계산 API
// ==========================================
app.post('/api/calculate-fee', (req, res) => {
    const { estimatedValue } = req.body;
    const value = parseFloat(estimatedValue);

    if (isNaN(value) || value <= 0) {
        return res.status(400).json({ success: false, message: '올바른 자산가액을 입력하세요.' });
    }

    // 간단 수수료 계산 로직 (예시 요율)
    let baseFee = 0;
    if (value <= 50000000) {
        baseFee = Math.max(200000, value * 0.005);
    } else if (value <= 500000000) {
        baseFee = 250000 + (value - 50000000) * 0.003;
    } else if (value <= 1000000000) {
        baseFee = 1600000 + (value - 500000000) * 0.002;
    } else {
        baseFee = 2600000 + (value - 1000000000) * 0.001;
    }

    baseFee = Math.floor(baseFee);
    const vat = Math.floor(baseFee * 0.1);
    const totalFee = baseFee + vat;

    res.json({
        success: true,
        baseFee,
        vat,
        totalFee
    });
});

// ==========================================
// [API 2] 감정평가 의뢰 접수 API
// ==========================================
app.post('/api/appraisal-requests', upload.array('attachment'), (req, res) => {
    const { requestType, clientName, clientPhone, clientEmail, purpose, propertyType, address, ownerName, estimatedMarketValue, detail } = req.body;

    if (!clientName || !clientPhone || !purpose || !propertyType || !address) {
        return res.status(400).json({ success: false, message: '필수 입력 항목이 누락되었습니다.' });
    }

    // 💡 접수번호 생성 로직 (Q년월-01 형식)
    const today = new Date();
    const year = String(today.getFullYear()).slice(2); // 연도 뒤 2자리 (예: 2026 -> '26')
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월 (예: 8 -> '08')
    const sequence = String(appraisalRequests.length + 1).padStart(2, '0'); // 일련번호 (01, 02, 03 ...)
    
    const applicationNo = `Q${year}${month}-${sequence}`;

    const newRequest = {
        application_no: applicationNo,
        requestType,
        clientName,
        clientPhone,
        clientEmail,
        purpose,
        propertyType,
        address,
        ownerName,
        estimatedMarketValue,
        detail,
        status: '접수완료',
        assigned_appraiser: '담당자 배정 중',
        final_fee: 0,
        payment_status: '미결제',
        createdAt: new Date().toLocaleString('ko-KR')
    };

    appraisalRequests.push(newRequest);
    console.log('📌 새 감정평가 의뢰 접수:', newRequest);

    res.json({
        success: true,
        applicationNo,
        message: '성공적으로 접수되었습니다.'
    });
});

// ==========================================
// [API 3] 진행상태 및 결과 조회 API
// ==========================================
app.get('/api/appraisal-requests/track', (req, res) => {
    const { applicationNo, clientPhone } = req.query;

    const result = appraisalRequests.find(item => 
        item.application_no === applicationNo && item.clientPhone === clientPhone
    );

    if (result) {
        res.json({ success: true, data: result });
    } else {
        res.status(404).json({ success: false, message: '일치하는 의뢰 내역을 찾을 수 없습니다.' });
    }
});

// ==========================================
// [API 4] 1:1 고객 문의 접수 API
// ==========================================
app.post('/api/qna', (req, res) => {
    const { writerName, writerPhone, title, content } = req.body;

    if (!writerName || !writerPhone || !title || !content) {
        return res.status(400).json({ success: false, message: '모든 작성란을 입력해 주세요.' });
    }

    const newQna = {
        id: Date.now(),
        writerName,
        writerPhone,
        title,
        content,
        createdAt: new Date().toLocaleString('ko-KR')
    };

    qnaList.push(newQna);
    console.log('💬 새 1:1 문의 접수:', newQna);

    res.json({ success: true, message: '문의가 성공적으로 등록되었습니다.' });
});

// ==========================================
// [API 5] 관리자용 문의 목록 조회 API
// ==========================================
app.get('/api/admin/qna-list', (req, res) => {
    res.json({ success: true, qnaList });
});

// ==========================================
// [API 6] 관리자용 감정평가 의뢰 목록 조회 API
// ==========================================
app.get('/api/admin/appraisal-requests', (req, res) => {
    res.json({ 
        success: true, 
        requests: appraisalRequests 
    });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
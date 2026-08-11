const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // 👈 구글 시트 전송용 모듈

const app = express();
const PORT = process.env.PORT || 3000;

// 1. 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

// 💡 아까 복사해 둔 구글 앱스 스크립트 웹 앱 URL을 여기에 넣으세요!
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxu2poRFQJNvvyoyOwLVnDtZMLHuBbX0G2OIrP9Nfto0dCp6HgccOZmZmYeZichg7wG/exec';

// ==========================================
// [API 1] 감정평가 예상 수수료 계산 API
// ==========================================
app.post('/api/calculate-fee', (req, res) => {
    const { estimatedValue } = req.body;
    const value = parseFloat(estimatedValue);

    if (isNaN(value) || value <= 0) {
        return res.status(400).json({ success: false, message: '올바른 자산가액을 입력하세요.' });
    }

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

    res.json({ success: true, baseFee, vat, totalFee });
});

// ==========================================
// [API 2] 감정평가 의뢰 접수 API (구글 시트 연동)
// ==========================================
app.post('/api/appraisal-requests', upload.array('attachment'), async (req, res) => {
    const { requestType, clientName, clientPhone, clientEmail, purpose, propertyType, address, ownerName, estimatedMarketValue, detail } = req.body;

    if (!clientName || !clientPhone || !purpose || !propertyType || !address) {
        return res.status(400).json({ success: false, message: '필수 입력 항목이 누락되었습니다.' });
    }

    // 접수번호 생성 (Q년월-랜덤4자리 형식)
    const today = new Date();
    const year = String(today.getFullYear()).slice(2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const applicationNo = `Q${year}${month}-${randomNum}`;

    const newRequest = {
        application_no: applicationNo,
        requestType: requestType || '일반의뢰',
        clientName,
        clientPhone,
        clientEmail: clientEmail || '',
        purpose,
        propertyType,
        address,
        ownerName: ownerName || '',
        estimatedMarketValue: estimatedMarketValue || '',
        detail: detail || '',
        status: '접수완료',
        assigned_appraiser: '담당자 배정 중',
        final_fee: 0,
        payment_status: '미결제',
        createdAt: new Date().toLocaleString('ko-KR')
    };

    // 구글 스프레드시트로 데이터 전송
    try {
        await axios.post(GOOGLE_SHEET_URL, newRequest);
        console.log('📊 구글 스프레드시트 저장 성공:', applicationNo);
    } catch (error) {
        console.error('❌ 구글 스프레드시트 전송 실패:', error.message);
    }

    res.json({
        success: true,
        applicationNo,
        message: '성공적으로 접수되었습니다.'
    });
});

// ==========================================
// [API 3] 1:1 고객 문의 접수 API
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

    console.log('💬 새 1:1 문의 접수:', newQna);
    res.json({ success: true, message: '문의가 성공적으로 등록되었습니다.' });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
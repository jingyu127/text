// 設定全域變數
let questions = []; // 儲存所有題目
let quizData = [];  // 儲存隨機選出的 4 題
let currentQuestionIndex = 0; // 當前題目索引
let score = 0; // 測驗分數
// 遊戲狀態: 'start' (起始頁), 'quiz' (測驗中), 'feedback' (回饋動畫中), 'result' (結果頁)
let gameState = 'start'; // 初始狀態設定為起始頁

// 回饋動畫相關變數
let feedbackMessage = ""; 
let feedbackColor;
let feedbackEndTime = 0;
let animationAlpha = 255; // 用於控制動畫透明度
let resultTransitioned = false; // 旗標，確保只處理一次結束邏輯

// 畫布尺寸
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const QUESTION_COUNT = 4; // 固定的題目數量

// 測驗卷的 CSV 文字資料
const csvDataString = `
"p5.js中,哪個函數在程式開始時只運行一次?","setup","draw","preload","mousePressed","A"
"哪個函數會不斷重複執行,用於繪製畫面?","setup","draw","mouseClicked","keyTyped","B"
"用於載入外部檔案(如圖片或CSV)的函數是?","createCanvas","background","preload","fill","C"
"設定畫布大小的函數是?","setSize","canvas","createCanvas","window","C"
"改變圖形填充顏數的函數是?","fill","stroke","rect","color","A"
"p5.js的畫布原點(0,0)在哪個位置?","左上角","右下角","中心","左下角","A"
`;

// 選項按鈕設定
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_SIZE = { w: CANVAS_WIDTH * 0.4, h: 50 };
const OPTION_PADDING = 20;

/**
 * 解析 CSV 格式的字串並將其轉換為題目物件陣列。
 * @param {string} dataString - 包含 CSV 數據的字串。
 * @returns {Array<Object>} 題目物件陣列。
 */
function parseCSV(dataString) {
    const rows = dataString.trim().split('\n');
    const parsedQuestions = [];

    rows.forEach(row => {
        // 使用正則表達式來處理引號內的逗號
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

        if (values.length === 6) {
            // 清理引號
            const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

            parsedQuestions.push({
                question: cleanValues[0],
                options: {
                    A: cleanValues[1],
                    B: cleanValues[2],
                    C: cleanValues[3],
                    D: cleanValues[4]
                },
                correctAnswer: cleanValues[5].toUpperCase()
            });
        }
    });
    return parsedQuestions;
}

/**
 * 從所有題目中隨機選取指定數量的題目。
 * @param {Array<Object>} allQuestions - 所有題目陣列。
 * @param {number} count - 欲選取的題目數量。
 * @returns {Array<Object>} 隨機選出的題目陣列。
 */
function selectRandomQuestions(allQuestions, count) {
    if (allQuestions.length <= count) {
        // 如果總數不足或等於所需數量，直接返回所有題目 (並打亂順序)
        return shuffle(allQuestions.slice());
    }

    let shuffled = shuffle(allQuestions.slice());
    return shuffled.slice(0, count);
}

/**
 * 打亂陣列順序 (Fisher-Yates Shuffle)。
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = floor(random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

// p5.js: 程式開始時只運行一次
function preload() {
    // 1. 解析 CSV 資料
    questions = parseCSV(csvDataString);
    
    // 2. 隨機選取指定數量的題目
    quizData = selectRandomQuestions(questions, QUESTION_COUNT); 
    
    if (quizData.length < QUESTION_COUNT) {
         console.error("錯誤：題庫中的題目數量不足。");
    }
}

// p5.js: 初始化畫布和設定
function setup() {
    // 這一行創建 p5.js 畫布
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    // 這一行將畫布附加到 <div id="quiz-container"> 中
    canvas.parent('quiz-container'); 
    
    // 設定所有文字都以其中心點為基準點
    textAlign(CENTER, CENTER);
    textSize(16);
    // 讓 draw 迴圈持續運行，以支援懸停效果和動畫
}

// p5.js: 不斷重複執行,用於繪製畫面
function draw() {
    background(255); // 白色背景

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'quiz') {
        drawQuizScreen();
    } else if (gameState === 'feedback') {
        drawFeedbackScreen();
    } else if (gameState === 'result') {
        drawResultScreen();
    }
}

/**
 * 繪製起始封面畫面。
 */
function drawStartScreen() {
    // 標題
    fill(46, 139, 87); // 海綠色
    textSize(40);
    text("p5.js 測驗系統", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    // 按鈕區域
    const buttonW = 250;
    const buttonH = 70;
    const buttonX = CANVAS_WIDTH / 2 - buttonW / 2;
    const buttonY = CANVAS_HEIGHT / 2 + 30;

    // 檢查滑鼠是否懸停
    if (
        mouseX > buttonX &&
        mouseX < buttonX + buttonW &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonH
    ) {
        fill(100, 180, 100); // 深綠色 (懸停效果)
    } else {
        fill(46, 139, 87); // 海綠色
    }
    
    // 繪製圓角矩形按鈕
    rect(buttonX, buttonY, buttonW, buttonH, 10);

    // 按鈕文字
    fill(255); // 白色
    textSize(24);
    text("開始測驗", CANVAS_WIDTH / 2, buttonY + buttonH / 2);
}

/**
 * 繪製測驗畫面 (顯示問題和選項)。
 */
function drawQuizScreen() {
    if (currentQuestionIndex >= quizData.length) return;

    const currentQ = quizData[currentQuestionIndex];
    
    // --- 題目編號 (Title) ---
    fill(46, 139, 87); // 海綠色
    textSize(24);
    // 題號使用中心點繪製，保證置中
    text(`第 ${currentQuestionIndex + 1} 題 / 共 ${quizData.length} 題`, CANVAS_WIDTH / 2, 40);

    // --- 問題區塊 (Question Box) ---
    const questionBoxW = CANVAS_WIDTH * 0.9;
    const questionBoxH = 80;
    const questionCenterX = CANVAS_WIDTH / 2;
    const questionCenterY = 140; // 保持 Y 座標不變
    const questionBoxX = questionCenterX - questionBoxW / 2;
    const questionBoxY = questionCenterY - questionBoxH / 2;
    
    // 繪製問題背景框 (輕微灰色背景)
    fill(240); 
    stroke(200); // 輕微邊框
    strokeWeight(1);
    rect(questionBoxX, questionBoxY, questionBoxW, questionBoxH, 10);
    noStroke();
    
    // 問題文字
    fill(0); // 黑色
    textSize(20); 
    
    // 確保文字在框內完美置中 (僅使用中心點座標)
    text(currentQ.question, questionCenterX, questionCenterY);

    // --- 繪製選項按鈕 (Options) ---
    const startY = 250; 
    const gap = 20; 
    
    OPTION_LABELS.forEach((label, index) => {
        const x = (index % 2 === 0) ? CANVAS_WIDTH / 4 : CANVAS_WIDTH * 3 / 4;
        const y = startY + (floor(index / 2) * (OPTION_SIZE.h + gap)); 
        
        const btnX = x - OPTION_SIZE.w / 2;
        const btnY = y - OPTION_SIZE.h / 2;

        // 檢查滑鼠是否懸停 (此處依賴 draw() 的連續運行)
        if (
            mouseX > btnX &&
            mouseX < btnX + OPTION_SIZE.w &&
            mouseY > btnY &&
            mouseY < btnY + OPTION_SIZE.h
        ) {
            fill(144, 238, 144); // 淺綠色 (懸停效果)
        } else {
            fill(220); // 淺灰色
        }
        
        // 繪製圓角矩形按鈕 (強調邊框)
        stroke(150); // 灰色邊框
        strokeWeight(2); // 邊框粗細
        rect(btnX, btnY, OPTION_SIZE.w, OPTION_SIZE.h, 10); // 圓角半徑 10
        noStroke(); // 繪製文字前取消邊框

        // 按鈕文字
        fill(0); // 黑色
        textSize(16); 
        const optionText = `${label}. ${currentQ.options[label]}`;
        
        // 選項文字使用中心點 (x, y) 繪製，是置中的。
        text(optionText, x, y); 
    });
}

/**
 * 繪製答題回饋畫面 (3秒動畫)。
 */
function drawFeedbackScreen() {
    // 背景略為變暗，將 quiz 畫面覆蓋
    fill(255, 255, 255, 180);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 繪製回饋文字
    fill(feedbackColor);
    textSize(36);
    
    // 簡單的縮放動畫效果 (放大後縮小)
    // 使用 constrain 確保不會超出 [1.0, 1.2] 範圍
    let scaleFactor = constrain(map(millis(), feedbackEndTime - 3000, feedbackEndTime, 1.2, 1.0), 1.0, 1.2);
    
    // 確保文字大小不會太小
    let currentTextSize = max(36, 36 * scaleFactor);
    textSize(currentTextSize);

    // 讓文字垂直漂移，增加動態感
    let driftY = sin(millis() / 300) * 5; 
    
    text(feedbackMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + driftY);
    
    // 檢查時間是否結束 (3秒)
    if (millis() >= feedbackEndTime) {
        
        // 判斷下一狀態：結果頁面或下一題
        if (currentQuestionIndex >= quizData.length) {
            // 這是最後一題的回饋，跳轉到結果頁
            
            // 關鍵修正：使用 resultTransitioned 旗標和 setTimeout 來保證渲染
            if (!resultTransitioned) {
                gameState = 'result'; 
                resultTransitioned = true;

                // 等待 100 毫秒 (約 6 幀) 讓 draw() 成功繪製結果畫面後再停止
                setTimeout(() => {
                    noLoop();
                }, 100); 
            }
            
        } else {
            // 繼續下一題
            gameState = 'quiz'; 
            // Loop 保持運行
        }
    }
}

/**
 * 繪製結果畫面 (顯示成績和回饋)。
 */
function drawResultScreen() {
    const finalScore = score;
    const percentage = (finalScore / quizData.length) * 100;
    let resultFeedback = "";
    let resultFeedbackColor = color(0); // 預設黑色

    if (percentage === 100) {
        resultFeedback = "太棒了！您是 p5.js 大師！";
        resultFeedbackColor = color(0, 128, 0); // 綠色
    } else if (percentage >= 75) {
        resultFeedback = "表現優異！您對 p5.js 掌握得很好！";
        resultFeedbackColor = color(30, 144, 255); // 藍色
    } else if (percentage >= 50) {
        resultFeedback = "不錯的成績！再多複習一些基本函數吧！";
        resultFeedbackColor = color(255, 165, 0); // 橘色
    } else {
        resultFeedback = "再接再厲！讓我們一起複習基礎知識！";
        resultFeedbackColor = color(255, 69, 0); // 紅色
    }

    // 標題 
    fill(46, 139, 87);
    textSize(32);
    text("測驗結果", CANVAS_WIDTH / 2, 80);

    // 成績
    fill(0);
    textSize(28);
    // 顯示您要求的 "答對 X 分之 Y"
    text(`您的成績: ${finalScore} / ${quizData.length} 題`, CANVAS_WIDTH / 2, 160);
    
    // 百分比
    textSize(20);
    text(`(正確率: ${percentage.toFixed(0)}%)`, CANVAS_WIDTH / 2, 200);

    // 回饋用語 (單行繪製，確保X軸置中)
    fill(resultFeedbackColor);
    textSize(24);
    text(resultFeedback, CANVAS_WIDTH / 2, 270); 

    // 重新開始按鈕
    const buttonW = 200;
    const buttonH = 60;
    const buttonX = CANVAS_WIDTH / 2 - buttonW / 2;
    const buttonY = 350;

    // 繪製按鈕
    if (
        mouseX > buttonX &&
        mouseX < buttonX + buttonW &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonH
    ) {
        fill(100, 180, 100); // 深綠色 (懸停效果)
    } else {
        fill(46, 139, 87); // 海綠色
    }
    rect(buttonX, buttonY, buttonW, buttonH, 10);

    // 按鈕文字
    fill(255); // 白色
    textSize(20);
    text("重新開始", CANVAS_WIDTH / 2, buttonY + buttonH / 2);
}


// p5.js: 滑鼠按鈕被按下時運行
function mousePressed() {
    // 處理四種狀態的點擊事件
    if (gameState === 'start') {
        handleStartClick();
    } else if (gameState === 'quiz') {
        handleQuizClick();
    } else if (gameState === 'result') {
        handleResultClick();
    }
}

/**
 * 處理起始畫面的滑鼠點擊 (開始測驗按鈕)。
 */
function handleStartClick() {
    const buttonW = 250;
    const buttonH = 70;
    const buttonX = CANVAS_WIDTH / 2 - buttonW / 2;
    const buttonY = CANVAS_HEIGHT / 2 + 30;
    
    if (
        mouseX > buttonX &&
        mouseX < buttonX + buttonW &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonH
    ) {
        // 點擊開始按鈕，進入測驗狀態
        gameState = 'quiz';
        // 確保 loop() 運行以顯示第一道題目
        loop(); 
    }
}

/**
 * 處理測驗中的滑鼠點擊。
 */
function handleQuizClick() {
    if (currentQuestionIndex >= quizData.length) return;

    const currentQ = quizData[currentQuestionIndex];
    const startY = 250; // 與 drawQuizScreen 保持一致
    const gap = 20;

    // 檢查選項點擊
    OPTION_LABELS.forEach((label, index) => {
        const x = (index % 2 === 0) ? CANVAS_WIDTH / 4 : CANVAS_WIDTH * 3 / 4;
        const y = startY + (floor(index / 2) * (OPTION_SIZE.h + gap));
        
        const btnX = x - OPTION_SIZE.w / 2;
        const btnY = y - OPTION_SIZE.h / 2;

        if (
            mouseX > btnX &&
            mouseX < btnX + OPTION_SIZE.w && 
            mouseY > btnY &&
            mouseY < btnY + OPTION_SIZE.h 
        ) {
            let isCorrect = (label === currentQ.correctAnswer);
            
            // --- 設定回饋訊息 ---
            if (isCorrect) {
                score++;
                feedbackMessage = "答對了！太棒了！";
                feedbackColor = color(0, 150, 0); // 綠色
            } else {
                feedbackMessage = "答錯了！再接再厲！";
                feedbackColor = color(200, 50, 50); // 紅色
            }

            // 進入下一題 (不論對錯)
            currentQuestionIndex++;

            // --- 進入回饋狀態 ---
            gameState = 'feedback';
            feedbackEndTime = millis() + 3000; // 3 秒 (3000毫秒)
            resultTransitioned = false; // 重置旗標
            
            return; // 確保只處理一次點擊
        }
    });
}

/**
 * 處理結果頁面的滑鼠點擊 (重新開始按鈕)。
 */
function handleResultClick() {
    const buttonW = 200;
    const buttonH = 60;
    const buttonX = CANVAS_WIDTH / 2 - buttonW / 2;
    const buttonY = 350;

    if (
        mouseX > buttonX &&
        mouseX < buttonX + buttonW &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonH
    ) {
        // 重置遊戲狀態
        score = 0;
        currentQuestionIndex = 0;
        
        // 點擊重新開始後，回到起始畫面
        gameState = 'start'; 

        // 重新選取隨機題目，為下一輪準備
        quizData = selectRandomQuestions(questions, QUESTION_COUNT);

        // 確保迴圈運行以顯示起始畫面
        loop(); 
    }
}
let currentHumidity = 50.0; 
let targetTemp = 22.0; 




const ctx = document.getElementById('envChart').getContext('2d');

const envChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(20).fill(''), 
        datasets: [
            {
                label: '온도(°C)',
                data: Array(20).fill(22),
                borderColor: '#ff4d4d',
                yAxisID: 'y',     
                tension: 0.4
            },
            {
                label: '습도(%)',
                data: Array(20).fill(70),
                borderColor: '#2196f3',
                yAxisID: 'y1',    
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 15,
                max: 30,
                ticks: { color: '#ff4d4d' }
            },
            y1: { 
                type: 'linear',
                display: true,
                position: 'right', 
                min: 0,
                max: 100,
                grid: { drawOnChartArea: false }, 
                ticks: { color: '#2196f3' }
            }
        },
        plugins: {
            legend: { labels: { color: 'black' } }
        }
    }
});



function updateSlider(barId, numId, unit) {
    const bar = document.getElementById(barId);
    const num = document.getElementById(numId);

    if (bar && num) {
        bar.oninput = function() {
            const pct = (this.value - this.min) / (this.max - this.min);
            this.style.backgroundSize = (pct * 150) + 'px 100%';
            num.innerText = this.value + unit;
            if (barId === 'hncbar') {
                targetTemp = parseFloat(this.value);
            }
            updateVisuals();
        };
        bar.dispatchEvent(new Event('input'));
    }
}

updateSlider('waterbar', 'waternum', 'ml');
updateSlider('lightbar', 'lightnum', '%');
updateSlider('hncbar', 'hncnum', '°C');

const controlButtons = document.querySelectorAll('.controlbtn');

controlButtons.forEach(btn => {
    btn.onclick = () => {
        const currentValue = btn.value;
        const isActive = btn.classList.toggle('active');

        if (currentValue === "물 주기") {
            const waterAmount = parseInt(document.getElementById('waterbar').value);
  
            currentHumidity = Math.min(95, currentHumidity + (waterAmount / 10)); 

            currentTemp -= (waterAmount / 500);
    
            writeLog(`식물에 물을 ${waterAmount}ml 주었습니다. (현재 습도: ${currentHumidity.toFixed(1)}%)`, "INFO");
    
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 200);
            return;
        }

        if (currentValue.includes("조명")) {
            btn.value = isActive ? "조명 OFF" : "조명 ON";
            writeLog(isActive ? "조명을 켰습니다." : "조명을 껐습니다.", "INFO");
        } 
        else if (currentValue.includes("냉난방")) {
            btn.value = isActive ? "냉난방 OFF" : "냉난방 ON";
            writeLog(isActive ? "냉난방 시스템 가동 시작" : "냉난방 시스템 중지", "INFO");
        }
    };
});

function writeLog(message, type = 'INFO') {
    const logBox = document.getElementById('log');
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    const color = (type === 'WARN') ? '#ff4d4d' : 'white';

    logBox.innerHTML += `
        <p style="color:${color}; margin: 20px 20px; font-size:14px; font-weight: 500;">
            [${timeString}] [${type}] ${message}
        </p>`;

    logBox.scrollTop = logBox.scrollHeight;
}

let currentTemp = 22.0;
let lastWarnTime = 0;


setInterval(() => {
    
    if (isAutomatic) {
        targetTemp = 22.0;
        const hncBtn = document.querySelector('input[value*="냉난방"]');
        if (hncBtn && !hncBtn.classList.contains('active')) {
            hncBtn.click();
        }

        const lightBtn = document.querySelector('input[value*="조명"]');
        const lightBar = document.getElementById('lightbar');
        if (lightBtn && lightBar) {
            if (!lightBtn.classList.contains('active')) {
                lightBtn.click(); 
            }
            lightBar.value = 60;
            lightBar.dispatchEvent(new Event('input'));
        }

        if (currentHumidity < 70) {
            const waterBtn = document.querySelector('input[value="물 주기"]');
            const waterBar = document.getElementById('waterbar');
            
            if (waterBar && waterBtn) {
                let gap = 85 - currentHumidity; 
                waterBar.value = Math.min(500, gap * 10); 
                waterBar.dispatchEvent(new Event('input'));
                waterBtn.click(); 
                writeLog(`[AUTO] 습도가 낮아 자동 급수를 실시합니다. (목표: 85%)`, "INFO");
            }
        }
    }

    const hncBtn = document.querySelector('input[value*="냉난방"]');
    
    if (hncBtn && hncBtn.classList.contains('active')) {
        if (Math.abs(currentTemp - targetTemp) > 0.1) {
            currentTemp += (currentTemp < targetTemp) ? 0.2 : -0.2;
        }
        if (currentTemp < targetTemp) {
            currentHumidity -= 0.3; 
        } else if (currentTemp > targetTemp) {
            currentHumidity -= 0.1;
        }


    } else {
        currentTemp += (Math.random() - 0.5);
    }
    currentTemp = Math.max(15, Math.min(27, currentTemp)); 

    const tempDisplay = document.getElementById('temp-value');

    if (tempDisplay) tempDisplay.innerText = `${currentTemp.toFixed(1)}°C`;

    const lightBar = document.getElementById('lightbar'); 
    const luxDisplay = document.getElementById('lux-value'); 
    const lightBtn = document.querySelector('input[value*="조명"]'); 
    let brightnessValue = 0.4; 

    if (lightBtn && lightBtn.classList.contains('active')) {
        const currentPercent = parseInt(lightBar.value);
        const calculatedLux = currentPercent * 50; 
        if (luxDisplay) luxDisplay.innerText = `${calculatedLux}Lux`;
        brightnessValue = 0.5 + (currentPercent / 100) * 1.0; 
        
        if (currentPercent > 60) {
            currentTemp += (currentPercent / 500);
        }

        const now = Date.now();
        if (now - lastWarnTime > 10000) {
            if (calculatedLux > 4000) {
                writeLog(`[WARN] 조명이 너무 강해 잎이 탈 수 있습니다! (${calculatedLux}Lux)`, "WARN");
                lastWarnTime = now;
            } else if (calculatedLux < 1000) {
                writeLog(`[WARN] 광량이 부족하여 성장이 더딥니다. (${calculatedLux}Lux)`, "WARN");
                lastWarnTime = now;
            }
        }
    } else {
        if (luxDisplay) luxDisplay.innerText = `0Lux`;
    }

    const now = Date.now();
    if (now - lastWarnTime > 10000) {
        if (currentTemp > 26) {
            writeLog(`[WARN] 온도가 너무 높습니다! 시원하게 해주세요. (${currentTemp.toFixed(1)}°C)`, "WARN");
            lastWarnTime = now;
        } else if (currentTemp < 18) {
            writeLog(`[WARN] 온도가 너무 낮습니다! 따뜻하게 해주세요. (${currentTemp.toFixed(1)}°C)`, "WARN");
            lastWarnTime = now;
        }
    }

    const evaporationRate = currentTemp >= 28 ? 0.3 : 0.1;
    currentHumidity = Math.max(20, currentHumidity - evaporationRate); 
    const humidityDisplay = document.getElementById('humi-value');
    if (humidityDisplay) humidityDisplay.innerText = `${currentHumidity.toFixed(1)}%`;

    if (now - lastWarnTime > 10000) {
        if (currentHumidity < 60) {
            writeLog(`[WARN] 공기가 너무 건조합니다! 분무가 필요해요. (${currentHumidity.toFixed(1)}%)`, "WARN");
            lastWarnTime = now;
        } else if (currentHumidity > 90) {
            writeLog(`[WARN] 과습 주의! 곰팡이가 생길 수 있습니다. (${currentHumidity.toFixed(1)}%)`, "WARN");
            lastWarnTime = now;
        }
    }

    updateVisuals();


    envChart.data.datasets[0].data.push(currentTemp); 
    envChart.data.datasets[0].data.shift();

    envChart.data.datasets[1].data.push(currentHumidity); 
    envChart.data.datasets[1].data.shift();

    
    envChart.data.labels.push(new Date().toLocaleTimeString());
    envChart.data.labels.shift();

    envChart.update('none'); 

}, 1000);

function updateVisuals() {
    const farmImage = document.getElementById('image');
    if (!farmImage) return;

    const lightBar = document.getElementById('lightbar');
    const lightBtn = document.querySelector('input[value*="조명"]');

    let br = 0.4;
    if (lightBtn && lightBtn.classList.contains('active')) {
        br = 0.5 + (parseInt(lightBar.value) / 100) * 1.0; 
    }

    let sat = Math.max(0, (currentHumidity - 20) / (60 - 20)); 
    sat = Math.min(1.0, sat);

    let hue = (22 - currentTemp) * 8; 
    
    farmImage.style.filter = `hue-rotate(${hue}deg) brightness(${br}) saturate(${sat})`;
}

let isAutomatic = false;

const autoBtn = document.getElementById('automatic');
const manualBtn = document.getElementById('manual');

autoBtn.onclick = () => {
    isAutomatic = true;
    autoBtn.classList.add('active');
    manualBtn.classList.remove('active');
    writeLog("자동 관리 모드(AI)를 시작합니다.", "INFO");
};

manualBtn.onclick = () => {
    isAutomatic = false;
    manualBtn.classList.add('active');
    autoBtn.classList.remove('active');
    writeLog("수동 관리 모드로 전환합니다.", "INFO");
};

window.onload = () => {
    manualBtn.classList.add('active');
};







let totalKWh = 0;
const RATE = 210; 
const CO2_FACTOR = 0.424;

let currentEff = 100; 

setInterval(() => {
    let powerStep = 0;

    const hncBtn = document.querySelector('input[value*="냉난방"]');
    const isHnc = hncBtn && hncBtn.classList.contains('active');
    if (isHnc) {
        const tempDiff = Math.abs(currentTemp - targetTemp);
        let inverterFactor = 1.0; 

        if (tempDiff > 3) {
            inverterFactor = 1.5; 
        } else if (tempDiff < 0.5) {
            inverterFactor = 0.3; 
        } else {
            inverterFactor = 0.7; 
        }

        powerStep += (2.2 * inverterFactor / 3600); 
    }

    const lightBtn = document.querySelector('input[value*="조명"]');
    const isLight = lightBtn && lightBtn.classList.contains('active');
    const lightBar = document.getElementById('lightbar');

    if (isLight && lightBar) {
        const bright = parseInt(lightBar.value) / 100;
        powerStep += (0.6 * bright / 3600);
    }
    totalKWh += powerStep;

    const isTempBad = (currentTemp > 26 || currentTemp < 18);
    const isHumidBad = (currentHumidity < 40 || currentHumidity > 90);
    
    const currentLux = isLight ? parseInt(lightBar.value) * 50 : 0;
    const isLightBad = isLight && (currentLux < 1000 || currentLux > 4000);

    if (isTempBad) {
        currentEff -= 0.8; 
    }
    if (isHumidBad) {
        currentEff -= 0.5; 
    }
    if (isLightBad) {
        currentEff -= 0.5;
    }
    if (!isTempBad && !isHumidBad && !isLightBad && currentEff < 100) {
        currentEff += 0.3; 
    }
    currentEff = Math.max(0, Math.min(100, currentEff));

    document.getElementById('p-usage').innerHTML = `${totalKWh.toFixed(3)} <small>kWh</small>`;
    document.getElementById('t-cost').innerHTML = `${Math.floor(totalKWh * RATE).toLocaleString()} <small>KRW</small>`;
    document.getElementById('c-foot').innerHTML = `${(totalKWh * CO2_FACTOR).toFixed(3)} <small>kgCO₂</small>`;
    
    const displayEff = Math.floor(currentEff);
    document.getElementById('e-eff').innerHTML = `${displayEff}<small>%</small>`;

    const bar = document.getElementById('status-bar-fill');
    const statusText = document.getElementById('m-status-text');
    
    if (bar && statusText) {
        bar.style.width = displayEff + "%";
        
        if(displayEff >= 80) {
            bar.style.background = "#4CAF50";
            statusText.innerText = "정상 운영 중 (Optimal)";
        } else if(displayEff >= 50) {
            bar.style.background = "#FFC107";
            statusText.innerText = "주의: 리스크 누적 중 (Caution)";
        } else {
            bar.style.background = "#F44336";
            statusText.innerText = "위험: 즉시 조치 필요 (Critical)";
        }
    }

}, 1000);





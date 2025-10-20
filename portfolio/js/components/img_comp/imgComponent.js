class gateway_img_class extends HTMLElement{
    connectedCallback(){
        this.innerHTML =`
        <!-- Inline SVG 로고 (Width=300, Height=100) -->
        <svg width="300" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="API Gateway logo">
        <!-- 배경 투명 -->
        <defs>
            <style>
            .teal { fill: #0e8b87; }
            .dark { fill: #2f3940; }
            .label { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 700; }
            </style>
        </defs>

        <!-- 아이콘 그룹 (왼쪽) -->
        <g transform="translate(12,14)">
            <!-- rounded square -->
            <rect x="0" y="8" rx="10" ry="10" width="64" height="48" class="teal"/>
            <!-- 내부 API 텍스트 -->
            <text x="32" y="40" font-size="20" text-anchor="middle" alignment-baseline="middle" fill="white" font-family="inherit" font-weight="700">API</text>

            <!-- 왼쪽 화살표 -->
            <g transform="translate(-8,32)">
            <rect x="0" y="-6" width="24" height="12" rx="6" ry="6" class="teal"/>
            <polygon points="24,-12 36,0 24,12" class="teal"/>
            </g>

            <!-- 오른쪽 화살표 -->
            <g transform="translate(64,32)">
            <rect x="12" y="-6" width="24" height="12" rx="6" ry="6" class="teal" transform="scale(-1,1) translate(-36,0)"/>
            <polygon points="-12,-12 0,0 -12,12" class="teal" transform="translate(12,0)"/>
            </g>
        </g>

        <!-- 텍스트 (오른쪽) -->
        <text x="100" y="60" class="label dark" font-size="26">API GATEWAY</text>
        </svg>`
    }
}

customElements.define('gateway-img', gateway_img_class);


class data_ans_class extends HTMLElement{
    connectedCallback(){
        this.innerHTML =`
            <!-- Inline SVG 로고 (Width=280, Height=100) -->
            <svg width="280" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Data Analytics logo">
            <defs>
                <style>
                .blue { fill: #0078d7; } /* 분석 느낌의 시원한 블루 */
                .gray { fill: #2f3940; } /* 텍스트용 진회색 */
                .accent { fill: #00b294; } /* 포인트용 민트색 */
                .label { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 700; }
                </style>
            </defs>

            <!-- 그래프 아이콘 그룹 (왼쪽) -->
            <g transform="translate(10,20)"> <!-- 왼쪽으로 10px 이동 -->
                <circle cx="30" cy="30" r="28" fill="#e8f3fc"/>
                <rect x="15" y="30" width="6" height="20" class="blue"/>
                <rect x="26" y="20" width="6" height="30" class="accent"/>
                <rect x="37" y="10" width="6" height="40" class="blue"/>
                <polyline points="15,40 26,25 37,15 48,18" fill="none" stroke="#0078d7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="15" cy="40" r="2" fill="#0078d7"/>
                <circle cx="26" cy="25" r="2" fill="#0078d7"/>
                <circle cx="37" cy="15" r="2" fill="#0078d7"/>
                <circle cx="48" cy="18" r="2" fill="#0078d7"/>
            </g>

            <!-- 텍스트 (오른쪽) -->
            <text x="100" y="60" class="label gray" font-size="24">DATA ANALYTICS</text>
            </svg>

            `
    }
}

customElements.define('data-ans-img', data_ans_class);


class reinforced_security_class extends HTMLElement{
    connectedCallback(){
        this.innerHTML =`
            <!-- Inline SVG 로고 (Width=250, Height=100, Compact Version) -->
            <svg width="290" height="110" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reinforce Security Agent (AI Agent) logo">
            <defs>
                <style>
                .blue { fill: #0078d7; } /* 신뢰감 있는 파란색 */
                .mint { fill: #00b294; } /* AI 포인트 색상 */
                .gray { fill: #2f3940; } /* 텍스트용 진회색 */
                .label { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 700; }
                </style>
            </defs>

            <!-- 방패 아이콘 그룹 (조금 왼쪽으로 압축) -->
            <g transform="translate(15,15)">
                <!-- 방패 외곽 -->
                <path d="M30 0 L60 10 L60 40 Q30 70 0 40 L0 10 Z" fill="#e9f5f9" stroke="#0078d7" stroke-width="2"/>
                <!-- 내부 회로선 -->
                <circle cx="30" cy="28" r="6" class="mint"/>
                <line x1="30" y1="6" x2="30" y2="22" stroke="#0078d7" stroke-width="2" stroke-linecap="round"/>
                <line x1="15" y1="20" x2="27" y2="28" stroke="#0078d7" stroke-width="2" stroke-linecap="round"/>
                <line x1="45" y1="20" x2="33" y2="28" stroke="#0078d7" stroke-width="2" stroke-linecap="round"/>
                <circle cx="30" cy="6" r="2" class="blue"/>
                <circle cx="15" cy="20" r="2" class="mint"/>
                <circle cx="45" cy="20" r="2" class="mint"/>
            </g>

            <!-- 텍스트 (간격 축소) -->
            <text x="85" y="45" class="label gray" font-size="19">REINFORCE SECURITY</text>
            <text x="85" y="70" class="label mint" font-size="17">(AI AGENT)</text>
            </svg>
            `
    }
}

customElements.define('reinfore-security-img', reinforced_security_class);


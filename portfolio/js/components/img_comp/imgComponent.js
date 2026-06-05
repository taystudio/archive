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


class cicd_img_class extends HTMLElement{
    connectedCallback(){
        this.innerHTML =`
        <!-- Inline SVG 로고 — CI/CD Platform -->
        <svg width="290" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CI/CD Platform logo">
        <defs>
            <style>
            .teal { fill: #0e8b87; } .blue { fill: #0078d7; } .mint { fill: #00b294; }
            .gray { fill: #2f3940; }
            .label { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 700; }
            </style>
        </defs>
        <!-- DevOps loop -->
        <g transform="translate(16,18)" fill="none" stroke-width="6" stroke-linecap="round">
            <circle cx="24" cy="32" r="20" stroke="#0e8b87"/>
            <circle cx="52" cy="32" r="20" stroke="#0078d7"/>
        </g>
        <g transform="translate(16,18)">
            <polygon points="24,8 31,14 24,20" fill="#0e8b87"/>
            <polygon points="52,56 45,50 52,44" fill="#0078d7"/>
        </g>
        <text x="98" y="44" class="label gray" font-size="20">CI / CD</text>
        <text x="98" y="68" class="label mint" font-size="15">PLATFORM</text>
        </svg>`
    }
}
customElements.define('cicd-img', cicd_img_class);


class cloud_infra_img_class extends HTMLElement{
    connectedCallback(){
        this.innerHTML =`
        <!-- Inline SVG 로고 — Cloud Infra -->
        <svg width="290" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cloud Infra & System logo">
        <defs>
            <style>
            .blue { fill: #0078d7; } .mint { fill: #00b294; } .gray { fill: #2f3940; }
            .label { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 700; }
            </style>
        </defs>
        <g transform="translate(14,20)">
            <!-- cloud -->
            <path d="M20 52 a16 16 0 0 1 3 -31 a22 22 0 0 1 42 5 a15 15 0 0 1 1 26 z"
                  fill="#e8f3fc" stroke="#0078d7" stroke-width="2"/>
            <!-- network nodes -->
            <circle cx="28" cy="40" r="3" class="blue"/>
            <circle cx="44" cy="34" r="3" class="mint"/>
            <circle cx="58" cy="42" r="3" class="blue"/>
            <line x1="28" y1="40" x2="44" y2="34" stroke="#0078d7" stroke-width="2"/>
            <line x1="44" y1="34" x2="58" y2="42" stroke="#0078d7" stroke-width="2"/>
        </g>
        <text x="98" y="44" class="label gray" font-size="19">CLOUD INFRA</text>
        <text x="98" y="68" class="label mint" font-size="15">&amp; SYSTEM</text>
        </svg>`
    }
}
customElements.define('cloud-infra-img', cloud_infra_img_class);


/* =======================================================================
   Academic topic logos — one consistent line-art style (icon + label),
   matching the IT project SVG logos. Used by the ME / CS archive cards.
   blue #0078d7 · teal #0e8b87 · mint #00b294 · gray #2f3940
   ======================================================================= */
function _topicLogo(label1, label2, icon){
    var t = '<text x="100" y="' + (label2 ? '44' : '58') + '" font-family="Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif" font-weight="700" font-size="19" fill="#2f3940">' + label1 + '</text>';
    if (label2) t += '<text x="100" y="68" font-family="Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif" font-weight="700" font-size="15" fill="#00b294">' + label2 + '</text>';
    return '<svg width="290" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label1 + '">' + icon + t + '</svg>';
}
function _defTopic(tag, label1, label2, icon){
    customElements.define(tag, class extends HTMLElement{
        connectedCallback(){ this.innerHTML = _topicLogo(label1, label2, icon); }
    });
}

// Machine Learning — neural network
_defTopic('ml-img','MACHINE','LEARNING',
    '<g stroke="#0078d7" stroke-width="1.5" stroke-opacity=".55">'+
    '<line x1="20" y1="30" x2="52" y2="40"/><line x1="20" y1="30" x2="52" y2="64"/>'+
    '<line x1="20" y1="52" x2="52" y2="40"/><line x1="20" y1="52" x2="52" y2="64"/>'+
    '<line x1="20" y1="74" x2="52" y2="40"/><line x1="20" y1="74" x2="52" y2="64"/>'+
    '<line x1="52" y1="40" x2="84" y2="52"/><line x1="52" y1="64" x2="84" y2="52"/></g>'+
    '<g fill="#0078d7"><circle cx="20" cy="30" r="4.5"/><circle cx="20" cy="52" r="4.5"/><circle cx="20" cy="74" r="4.5"/>'+
    '<circle cx="52" cy="40" r="4.5" fill="#00b294"/><circle cx="52" cy="64" r="4.5" fill="#00b294"/>'+
    '<circle cx="84" cy="52" r="4.5"/></g>');

// Reinforcement Learning — feedback loop + reward
_defTopic('rl-img','REINFORCEMENT','LEARNING',
    '<g fill="none" stroke="#0078d7" stroke-width="3.5" stroke-linecap="round">'+
    '<path d="M70 34 a26 26 0 1 0 8 30"/></g>'+
    '<polygon points="70,34 60,30 66,44" fill="#0078d7"/>'+
    '<g fill="#00b294"><polygon points="50,40 54,50 65,50 56,57 59,68 50,61 41,68 44,57 35,50 46,50"/></g>');

// Numerical Method / CFD — streamlines
_defTopic('cfd-img','NUMERICAL','METHOD · CFD',
    '<g fill="none" stroke="#0078d7" stroke-width="3" stroke-linecap="round">'+
    '<path d="M16 32 q24 -12 44 0 t24 0"/>'+
    '<path d="M16 52 q24 -12 44 0 t24 0" stroke="#0e8b87"/>'+
    '<path d="M16 72 q24 -12 44 0 t24 0"/></g>'+
    '<polygon points="84,30 76,27 78,35" fill="#0078d7"/>'+
    '<polygon points="84,50 76,47 78,55" fill="#0e8b87"/>'+
    '<polygon points="84,70 76,67 78,75" fill="#0078d7"/>');

// Fourier — overlapping sine waves
_defTopic('fourier-img','FOURIER','SERIES',
    '<g fill="none" stroke-width="3" stroke-linecap="round">'+
    '<path d="M14 52 q11 -28 22 0 t22 0 t22 0" stroke="#0078d7"/>'+
    '<path d="M14 52 q5.5 -16 11 0 t11 0 t11 0 t11 0 t11 0 t11 0 t11 0 t11 0" stroke="#00b294" stroke-opacity=".8"/></g>');

// Math & Stat — bell curve + scatter
_defTopic('mathstat-img','MATH','· STATISTICS',
    '<g><line x1="14" y1="78" x2="90" y2="78" stroke="#94a3b8" stroke-width="1.5"/>'+
    '<path d="M16 78 C40 78 40 26 52 26 C64 26 64 78 88 78" fill="none" stroke="#0078d7" stroke-width="3"/>'+
    '<circle cx="34" cy="60" r="2.4" fill="#00b294"/><circle cx="52" cy="34" r="2.4" fill="#00b294"/><circle cx="70" cy="58" r="2.4" fill="#00b294"/></g>');

// Dynamic Time Warping — warped sequences
_defTopic('dtw-img','DYNAMIC TIME','WARPING',
    '<g fill="none" stroke-width="3" stroke-linecap="round">'+
    '<path d="M14 34 q12 -16 24 0 t24 0 t24 0" stroke="#0078d7"/>'+
    '<path d="M14 70 q12 16 24 0 t24 0 t24 0" stroke="#0e8b87"/></g>'+
    '<g stroke="#00b294" stroke-width="1.4" stroke-opacity=".7">'+
    '<line x1="20" y1="30" x2="22" y2="74"/><line x1="38" y1="36" x2="44" y2="66"/>'+
    '<line x1="56" y1="34" x2="62" y2="74"/><line x1="74" y1="36" x2="80" y2="66"/></g>');

// Network — graph nodes
_defTopic('network-img','NETWORK','& SERVER',
    '<g stroke="#0078d7" stroke-width="1.6" stroke-opacity=".6">'+
    '<line x1="24" y1="30" x2="58" y2="22"/><line x1="24" y1="30" x2="34" y2="64"/>'+
    '<line x1="58" y1="22" x2="82" y2="48"/><line x1="34" y1="64" x2="70" y2="74"/>'+
    '<line x1="58" y1="22" x2="34" y2="64"/><line x1="82" y1="48" x2="70" y2="74"/></g>'+
    '<g fill="#0078d7"><circle cx="24" cy="30" r="5"/><circle cx="58" cy="22" r="5" fill="#00b294"/>'+
    '<circle cx="82" cy="48" r="5"/><circle cx="34" cy="64" r="5"/><circle cx="70" cy="74" r="5" fill="#00b294"/></g>');

// Algorithm — flow (start → decision → end)
_defTopic('algo-img','ALGORITHM',null,
    '<g fill="none" stroke="#0078d7" stroke-width="2">'+
    '<rect x="16" y="20" width="34" height="18" rx="9" fill="#e8f3fc"/>'+
    '<rect x="58" y="58" width="34" height="20" rx="3" fill="#e9f7f3" stroke="#0e8b87"/>'+
    '<polygon points="33,46 47,60 33,74 19,60" fill="#fff" stroke="#00b294"/>'+
    '<path d="M33 38 L33 46 M40 67 L58 68" stroke="#94a3b8"/></g>'+
    '<polygon points="58,68 50,65 52,71" fill="#94a3b8"/>');


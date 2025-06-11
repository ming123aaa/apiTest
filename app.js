// 默认请求头
const DEFAULT_HEADERS = {
    "Content-Type": "application/json"
};

// 标签页切换功能
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("visible");
    }
    
    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).classList.add("visible");
    evt.currentTarget.className += " active";
}

// 发送请求函数
async function sendRequest() {
    const method = document.getElementById("method").value;
    const url = document.getElementById("url").value.trim();
    let headers = {};
    let body = null;
    
    try {
        const headersText = document.getElementById("headers").value.trim();
        if (headersText) {
            headers = JSON.parse(headersText);
        }
    } catch (e) {
        alert("请求头格式错误，必须是有效的JSON格式");
        return;
    }
    
    try {
        const bodyText = document.getElementById("body").value.trim();
        if (bodyText && ["POST", "PUT", "PATCH"].includes(method)) {
            body = bodyText;
            // 如果是JSON格式的请求体，自动设置Content-Type
            if (bodyText.startsWith("{") || bodyText.startsWith("[")) {
                headers["Content-Type"] = headers["Content-Type"] || "application/json";
            }
        }
    } catch (e) {
        alert("请求体格式错误");
        return;
    }
    
    if (!url) {
        alert("请输入请求URL");
        return;
    }
    
    const startTime = Date.now();
    
    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 处理响应
        const statusCode = response.status;
        const statusText = response.statusText;
        const responseHeaders = {};
        
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        
        let responseBody;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseBody = await response.json();
            responseBody = JSON.stringify(responseBody, null, 2);
        } else {
            responseBody = await response.text();
        }
        
        // 更新UI
        const statusElement = document.getElementById("status-code");
        statusElement.textContent = `${statusCode} ${statusText}`;
        statusElement.className = "status " + (statusCode >= 200 && statusCode < 300 ? "success" : "error");
        
        document.getElementById("response-time").textContent = `${responseTime} ms`;
        document.getElementById("response-headers").value = JSON.stringify(responseHeaders, null, 2);
        document.getElementById("response-body").value = responseBody;
        
        // 保存到历史记录
        saveToHistory({
            method,
            url,
            headers,
            body,
            statusCode,
            statusText,
            responseHeaders,
            responseBody,
            responseTime,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        const endTime = Date.now();
        document.getElementById("status-code").textContent = "Error";
        document.getElementById("status-code").className = "status error";
        document.getElementById("response-time").textContent = `${endTime - startTime} ms`;
        document.getElementById("response-headers").value = "";
        document.getElementById("response-body").value = error.message;
    }
}

// 历史记录功能
function saveToHistory(requestData) {
    let history = JSON.parse(localStorage.getItem("apiHistory") || "[]");
    
    // 限制历史记录数量
    if (history.length >= 50) {
        history = history.slice(0, 49);
    }
    
    history.unshift(requestData);
    localStorage.setItem("apiHistory", JSON.stringify(history));
    
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem("apiHistory") || "[]");
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    
    history.forEach((item, index) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        historyItem.innerHTML = `
            <strong>${item.method} ${item.url}</strong>
            <div>${item.statusCode} ${item.statusText} - ${item.responseTime}ms</div>
            <small>${new Date(item.timestamp).toLocaleString()}</small>
        `;
        
        historyItem.addEventListener("click", () => {
            loadHistoryItem(item);
            openTab(null, 'request-tab');
        });
        
        historyList.appendChild(historyItem);
    });
}

function loadHistoryItem(item) {
    document.getElementById("method").value = item.method;
    document.getElementById("url").value = item.url;
    document.getElementById("headers").value = JSON.stringify(item.headers, null, 2);
    document.getElementById("body").value = item.body || "";
    
    document.getElementById("status-code").textContent = `${item.statusCode} ${item.statusText}`;
    document.getElementById("status-code").className = "status " + (item.statusCode >= 200 && item.statusCode < 300 ? "success" : "error");
    document.getElementById("response-time").textContent = `${item.responseTime} ms`;
    document.getElementById("response-headers").value = JSON.stringify(item.responseHeaders, null, 2);
    document.getElementById("response-body").value = typeof item.responseBody === "string" ? item.responseBody : JSON.stringify(item.responseBody, null, 2);
}

// 生成表单数据
function generateFormData() {
    const bodyTextarea = document.getElementById("body");
    bodyTextarea.value = "key1=value1&key2=value2";
}

// 格式化 JSON
function formatJSON() {
    const bodyTextarea = document.getElementById("body");
    try {
        const jsonData = JSON.parse(bodyTextarea.value);
        bodyTextarea.value = JSON.stringify(jsonData, null, 2);
    } catch (e) {
        alert("无法格式化，请检查输入的 JSON 格式是否正确");
    }
}

// JSON 转表单
function jsonToForm() {
    const bodyTextarea = document.getElementById("body");
    const headersTextarea = document.getElementById("headers");
    try {
        const jsonData = JSON.parse(bodyTextarea.value);
        const formData = Object.entries(jsonData)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        bodyTextarea.value = formData;
    
        try {
            let headers = JSON.parse(headersTextarea.value);
            headers["Content-Type"] = "application/x-www-form-urlencoded";
            headersTextarea.value = JSON.stringify(headers, null, 2);
        } catch (e) {
            // 解析失败时，尝试保留原有请求头数据
            let headers = {};
            try {
                // 若原请求头有数据，先解析出来
                if (headersTextarea.value.trim()) {
                    headers = JSON.parse(headersTextarea.value);
                }
            } catch (parseError) {
                // 若解析失败，保持 headers 为空对象
            }
            headers["Content-Type"] = "application/x-www-form-urlencoded";
            headersTextarea.value = JSON.stringify(headers, null, 2);
        }
    } catch (e) {
        alert("无法转换，请检查输入的 JSON 格式是否正确");
    }
}

// 表单转 JSON
function formToJson() {
    const bodyTextarea = document.getElementById("body");
    const headersTextarea = document.getElementById("headers");
    const formData = bodyTextarea.value;
    const jsonObj = {};
    const keyValuePairs = formData.split('&');
    keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=').map(decodeURIComponent);
        if (key) {
            jsonObj[key] = value;
        }
    });
    bodyTextarea.value = JSON.stringify(jsonObj, null, 2);

    try {
        let headers = JSON.parse(headersTextarea.value);
        headers["Content-Type"] = "application/json";
        headersTextarea.value = JSON.stringify(headers, null, 2);
    } catch (e) {
        // 解析失败时，尝试保留原有请求头数据
        let headers = {};
        try {
            // 若原请求头有数据，先解析出来
            if (headersTextarea.value.trim()) {
                headers = JSON.parse(headersTextarea.value);
            }
        } catch (parseError) {
            // 若解析失败，保持 headers 为空对象
        }
        headers["Content-Type"] = "application/json";
        headersTextarea.value = JSON.stringify(headers, null, 2);
    }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
    // 设置默认请求头
    document.getElementById("headers").value = JSON.stringify(DEFAULT_HEADERS, null, 2);
    
    renderHistory();
    
    // 为URL输入框添加常用API示例
    const urlInput = document.getElementById("url");
    urlInput.addEventListener("focus", () => {
        if (!urlInput.value) {
            urlInput.value = "https://";
        }
    });
});
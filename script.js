// 全局变量存储计算结果
let calculationResults = {
    M: 0,
    removedBidders: [],
    remainingForA1: [],
    A1: 0,
    intervalLower: 0,
    intervalUpper: 0,
    validBidders: [],
    A2: 0,
    Pbase: 0,
    allResults: []
};

// 生成投标人表格
function generateBidderTable() {
    const M = parseInt(document.getElementById('bidderCount').value);
    const tbody = document.getElementById('bidderTableBody');
    
    if (!M || M <= 0) {
        alert('请输入有效的投标人数量！');
        return;
    }
    
    if (M > 100) {
        alert('投标人数量过多，请输入 100 以内的数字！');
        return;
    }
    
    tbody.innerHTML = '';
    
    for (let i = 0; i < M; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td><input type="text" class="bidder-name-input" placeholder="投标人${i + 1}" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px;"></td>
            <td><input type="number" class="bidder-price-input" placeholder="请输入报价" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px;"></td>
            <td><button class="btn btn-secondary" onclick="addRow(${i})" style="padding: 5px 10px; font-size: 12px;">➕ 插入</button></td>
        `;
        tbody.appendChild(tr);
    }
}

// 添加行
function addRow(index) {
    const tbody = document.getElementById('bidderTableBody');
    const tr = document.createElement('tr');
    const rowCount = tbody.rows.length;
    
    tr.innerHTML = `
        <td>${index + 1}</td>
        <td><input type="text" class="bidder-name-input" placeholder="新投标人" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px;"></td>
        <td><input type="number" class="bidder-price-input" placeholder="请输入报价" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 3px;"></td>
        <td><button class="btn btn-secondary" onclick="removeRow(this)" style="padding: 5px 10px; font-size: 12px; background: #f44336; color: white;">❌ 删除</button></td>
    `;
    
    if (index >= rowCount - 1) {
        tbody.appendChild(tr);
    } else {
        tbody.insertBefore(tr, tbody.rows[index + 1]);
    }
    
    // 重新编号
    updateRowNumbers();
}

// 删除行
function removeRow(btn) {
    const tbody = document.getElementById('bidderTableBody');
    if (tbody.rows.length <= 1) {
        alert('至少保留一个投标人！');
        return;
    }
    
    const tr = btn.parentNode.parentNode;
    tbody.removeChild(tr);
    
    // 重新编号
    updateRowNumbers();
}

// 更新行号
function updateRowNumbers() {
    const tbody = document.getElementById('bidderTableBody');
    for (let i = 0; i < tbody.rows.length; i++) {
        tbody.rows[i].cells[0].textContent = i + 1;
        // 更新插入按钮的索引
        const btn = tbody.rows[i].cells[3].querySelector('button');
        if (btn) {
            btn.setAttribute('onclick', `addRow(${i})`);
        }
    }
}

// 获取当前参数
function getCurrentParams() {
    return {
        w1: parseFloat(document.getElementById('paramW1').value) || -0.15,
        w2: parseFloat(document.getElementById('paramW2').value) || 0.1,
        C: parseFloat(document.getElementById('paramC').value) || 0,
        n1: parseFloat(document.getElementById('paramN1').value) || 1,
        n2: parseFloat(document.getElementById('paramN2').value) || 0.5,
        maxScore: parseFloat(document.getElementById('paramMaxScore').value) || 100
    };
}

// 恢复默认参数
function resetParams() {
    document.getElementById('paramW1').value = -0.15;
    document.getElementById('paramW2').value = 0.1;
    document.getElementById('paramC').value = 0;
    document.getElementById('paramN1').value = 1;
    document.getElementById('paramN2').value = 0.5;
    document.getElementById('paramMaxScore').value = 100;
    alert('参数已恢复默认值！');
}

// 快速报价预测
function quickPredict() {
    const price = parseFloat(document.getElementById('quickQuotePrice').value);
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || null;
    
    if (!price || price <= 0) {
        alert('请输入有效的报价！');
        return;
    }

    // 检查是否超过投标总价
    if (totalPrice && price > totalPrice) {
        alert(`⚠️ 您的报价 ${price.toFixed(2)} 万元已超过投标总价 ${totalPrice.toFixed(2)} 万元！\n\n请重新输入报价，最高不能超过 ${totalPrice.toFixed(2)} 万元。`);
        return;
    }

    if (!calculationResults.Pbase || calculationResults.Pbase === 0) {
        alert('请先进行完整计算，获取基准价后再使用快速预测功能！');
        return;
    }

    // 获取当前参数
    const params = getCurrentParams();
    const Pbase = calculationResults.Pbase;
    const diff = Math.abs(price - Pbase);
    const n = price >= Pbase ? params.n1 : params.n2;
    let score = params.maxScore - params.maxScore * n * diff / Pbase;
    if (score < 0) score = 0;

    // 计算最优价格
    let optimalPrice1 = Pbase * (1 + params.w2 * 0.3);
    let optimalPrice2 = Pbase * (1 + params.w2 * 0.2);
    let optimalPrice3 = Pbase * (1 + params.w1 * 0.3);
    
    // 如果输入了投标总价，确保推荐价格不超过投标总价
    if (totalPrice) {
        if (optimalPrice1 > totalPrice) optimalPrice1 = totalPrice;
        if (optimalPrice2 > totalPrice) optimalPrice2 = totalPrice;
        if (optimalPrice3 > totalPrice) optimalPrice3 = totalPrice;
    }
    
    const score1 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice1 - Pbase) / Pbase;
    const score2 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice2 - Pbase) / Pbase;
    const score3 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice3 - Pbase) / Pbase;

    const resultDiv = document.getElementById('quickPredictResult');
    resultDiv.style.display = 'block';

    let statusColor = score >= params.maxScore * 0.95 ? '#4caf50' : score >= params.maxScore * 0.85 ? '#ff9800' : '#f44336';
    let statusIcon = score >= params.maxScore * 0.95 ? '✅' : score >= params.maxScore * 0.85 ? '⚠️' : '❌';
    let statusText = score >= params.maxScore * 0.95 ? '优秀' : score >= params.maxScore * 0.85 ? '一般' : '较差';

    resultDiv.innerHTML = `
        <div style="background: white; color: #333; padding: 20px; border-radius: 8px;">
            ${totalPrice ? `<div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #4caf50;">
                <p style="color: #2e7d32; font-size: 13px; margin: 0;">
                    ✅ <strong>投标总价限制：</strong>您的报价不能超过 <strong>${totalPrice.toFixed(2)} 万元</strong>
                </p>
            </div>` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">当前基准价</div>
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${Pbase.toFixed(4)} 万元</div>
                </div>
                <div style="background: ${statusColor}15; padding: 15px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">预计得分 ${statusIcon}</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${statusColor};">${score.toFixed(3)} 分</div>
                    <div style="font-size: 12px; color: #666;">${statusText}</div>
                </div>
            </div>

            <div style="background: ${price >= Pbase ? '#ffebee' : '#e8f5e9'}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${price >= Pbase ? '#f44336' : '#4caf50'};">
                <div style="font-size: 14px; font-weight: bold; color: ${price >= Pbase ? '#c62828' : '#2e7d32'}; margin-bottom: 5px;">
                    📈 ${price >= Pbase ? '报价高于基准价' : '报价低于基准价'}
                </div>
                <div style="font-size: 13px; color: #555;">
                    与基准价差额：<strong>${diff.toFixed(4)} 万元</strong> 
                    (${((price - Pbase) / Pbase * 100).toFixed(2)}%)<br>
                    扣分系数 n = <strong>${n}</strong> 
                    (${price >= Pbase ? `高价区扣分快，n=${params.n1}` : `低价区扣分慢，n=${params.n2}`})<br>
                    失分：<strong>${(params.maxScore - score).toFixed(3)} 分</strong>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">🎯 最优报价建议</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div style="background: #f3e5f5; padding: 10px; border-radius: 5px;">
                        <div style="font-size: 12px; color: #666;">靠近上限</div>
                        <div style="font-size: 16px; font-weight: bold; color: #7b1fa2;">${optimalPrice1.toFixed(4)}</div>
                        <div style="font-size: 12px; color: #4caf50;">${score1.toFixed(2)}分</div>
                    </div>
                    <div style="background: #e8f5e9; padding: 10px; border-radius: 5px; border: 2px solid #4caf50;">
                        <div style="font-size: 12px; color: #666;">推荐 ⭐</div>
                        <div style="font-size: 16px; font-weight: bold; color: #2e7d32;">${optimalPrice2.toFixed(4)}</div>
                        <div style="font-size: 12px; color: #4caf50;">${score2.toFixed(2)}分</div>
                    </div>
                    <div style="background: #f3e5f5; padding: 10px; border-radius: 5px;">
                        <div style="font-size: 12px; color: #666;">靠近下限</div>
                        <div style="font-size: 16px; font-weight: bold; color: #7b1fa2;">${optimalPrice3.toFixed(4)}</div>
                        <div style="font-size: 12px; color: #4caf50;">${score3.toFixed(2)}分</div>
                    </div>
                </div>
            </div>

            <div style="background: #fff3e0; padding: 12px; border-radius: 5px; border-left: 4px solid #ff9800;">
                <div style="font-weight: bold; color: #f57f17; margin-bottom: 5px;">💡 优化建议</div>
                ${price >= Pbase ? `
                    <div style="font-size: 13px; color: #555;">
                        ⚠️ 您的报价偏高，建议下调至 <strong>${optimalPrice2.toFixed(4)} 万元</strong> 左右${optimalPrice2 >= totalPrice ? '（已达到投标总价上限）' : ''}<br>
                        可提升分数：<strong>${(score2 - score).toFixed(3)} 分</strong>
                    </div>
                ` : price < optimalPrice3 ? `
                    <div style="font-size: 13px; color: #555;">
                        ⚠️ 您的报价偏低，虽然得分不错但可能影响利润<br>
                        建议考虑适当上调至 <strong>${optimalPrice2.toFixed(4)} 万元</strong> 左右${optimalPrice2 >= totalPrice ? '（已达到投标总价上限）' : ''}
                    </div>
                ` : `
                    <div style="font-size: 13px; color: #555;">
                        ✅ 您的报价在合理区间内，得分较为理想
                    </div>
                `}
            </div>
        </div>
    `;

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 加载示例数据
function loadExample() {
    document.getElementById('bidderCount').value = 8;
    generateBidderTable();
    
    const tbody = document.getElementById('bidderTableBody');
    const exampleData = [
        ['A', 95],
        ['B', 100],
        ['C', 102],
        ['D', 108],
        ['E', 110],
        ['F', 85],
        ['G', 120],
        ['H', 98]
    ];
    
    for (let i = 0; i < exampleData.length; i++) {
        const row = tbody.rows[i];
        row.querySelector('.bidder-name-input').value = exampleData[i][0];
        row.querySelector('.bidder-price-input').value = exampleData[i][1];
    }
}

// 清空数据
function clearAll() {
    document.getElementById('bidderCount').value = '';
    document.getElementById('bidderTableBody').innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 30px; color: #999;">
                请先输入投标人数量，然后点击生成表格
            </td>
        </tr>
    `;
    document.getElementById('resultCard').style.display = 'none';
}

// 主计算函数
function calculate() {
    // 获取当前参数
    const params = getCurrentParams();
    
    // 解析输入
    const M = parseInt(document.getElementById('bidderCount').value);
    const tbody = document.getElementById('bidderTableBody');
    const rows = tbody.rows;

    if (!M || M <= 0) {
        alert('请输入有效的投标人数量！');
        return;
    }

    // 从表格中解析投标人数据
    const bidders = [];
    for (let i = 0; i < rows.length; i++) {
        const nameInput = rows[i].querySelector('.bidder-name-input');
        const priceInput = rows[i].querySelector('.bidder-price-input');
        
        const name = nameInput.value.trim() || `投标人${i + 1}`;
        const price = parseFloat(priceInput.value);
        
        if (!isNaN(price)) {
            // 检查报价是否高于投标总价
            const totalPrice = parseFloat(document.getElementById('totalPrice').value);
            if (totalPrice && price > totalPrice) {
                alert(`第 ${i + 1} 个投标人 ${name} 的报价 ${price} 万元 高于投标总价 ${totalPrice} 万元，请检查！`);
                return;
            }
            bidders.push({ name, price });
        } else {
            alert(`第 ${i + 1} 个投标人的报价无效，请输入数字！`);
            return;
        }
    }

    if (bidders.length === 0) {
        alert('请输入投标人报价数据！');
        return;
    }

    // 更新实际投标人数量
    const actualM = bidders.length;
    calculationResults.M = actualM;

    // 第 1 步：剔除极端报价
    const step1 = removeExtremeBidders(bidders, M);
    calculationResults.removedBidders = step1.removed;
    calculationResults.remainingForA1 = step1.remaining;

    // 第 2 步：计算 A1
    const A1 = calculationResults.remainingForA1.reduce((sum, b) => sum + b.price, 0) / calculationResults.remainingForA1.length;
    calculationResults.A1 = A1;

    // 第 3 步：确定合理报价区间
    const intervalLower = A1 * (1 + params.w1);
    const intervalUpper = A1 * (1 + params.w2);
    calculationResults.intervalLower = intervalLower;
    calculationResults.intervalUpper = intervalUpper;

    // 第 4 步：筛选有效投标人
    const validBidders = bidders.filter(b => 
        b.price > intervalLower && b.price < intervalUpper
    );
    
    // 如果没有有效投标人，则使用第 1 步剩余的投标人
    if (validBidders.length === 0) {
        calculationResults.validBidders = calculationResults.remainingForA1;
    } else {
        calculationResults.validBidders = validBidders;
    }

    // 第 5 步：计算 A2
    const A2 = calculationResults.validBidders.reduce((sum, b) => sum + b.price, 0) / calculationResults.validBidders.length;
    calculationResults.A2 = A2;

    // 第 6 步：确定基准价
    const Pbase = A2 * (1 + params.C);
    calculationResults.Pbase = Pbase;

    // 第 7 步：计算每个投标人的得分
    calculationResults.allResults = bidders.map(b => {
        const isValid = calculationResults.validBidders.some(vb => vb.name === b.name);
        const diff = Math.abs(b.price - Pbase);
        const n = b.price >= Pbase ? params.n1 : params.n2;
        let score = params.maxScore - params.maxScore * n * diff / Pbase;
        if (score < 0) score = 0;
        
        return {
            name: b.name,
            price: b.price,
            isValid,
            diff,
            n,
            score
        };
    });

    // 显示结果
    displayResults();
}

// 剔除极端报价函数
function removeExtremeBidders(bidders, M) {
    // 按价格排序
    const sorted = [...bidders].sort((a, b) => a.price - b.price);
    
    let removeLow = 0;
    let removeHigh = 0;

    if (M <= 5) {
        removeLow = 0;
        removeHigh = 0;
    } else if (M <= 10) {
        removeLow = 1;
        removeHigh = 1;
    } else if (M <= 20) {
        removeLow = 1;
        removeHigh = 2;
    } else if (M <= 30) {
        removeLow = 2;
        removeHigh = 3;
    } else {
        removeLow = 3;
        removeHigh = 4;
    }

    const removed = [];
    const remaining = [];

    // 标记被剔除的
    for (let i = 0; i < sorted.length; i++) {
        if (i < removeLow || i >= sorted.length - removeHigh) {
            removed.push(sorted[i]);
        } else {
            remaining.push(sorted[i]);
        }
    }

    return { removed, remaining };
}

// 显示计算结果
function displayResults() {
    // 获取当前参数
    const params = getCurrentParams();
    
    document.getElementById('resultCard').style.display = 'block';

    // 第 1 步结果
    const step1Div = document.getElementById('step1Result');
    let step1Html = `<p><strong>投标人数量 M = ${calculationResults.M}</strong></p>`;
    
    let ruleText = '';
    if (calculationResults.M <= 5) {
        ruleText = 'M ≤ 5，不剔除极端报价';
    } else if (calculationResults.M <= 10) {
        ruleText = '5 < M ≤ 10，去掉最高和最低各 1 个';
    } else if (calculationResults.M <= 20) {
        ruleText = '10 < M ≤ 20，去掉最高 2 个和最低 1 个';
    } else if (calculationResults.M <= 30) {
        ruleText = '20 < M ≤ 30，去掉最高 3 个和最低 2 个';
    } else {
        ruleText = 'M > 30，去掉最高 4 个和最低 3 个';
    }
    
    step1Html += `<p><strong>剔除规则：</strong>${ruleText}</p>`;
    
    if (calculationResults.removedBidders.length > 0) {
        step1Html += `<p><strong>剔除的投标人：</strong></p><ul>`;
        calculationResults.removedBidders.forEach(b => {
            step1Html += `<li>${b.name}：${b.price} 万元</li>`;
        });
        step1Html += `</ul>`;
    } else {
        step1Html += `<p class="success"><strong>无剔除，所有投标人参与 A1 计算</strong></p>`;
    }
    
    step1Html += `<p><strong>剩余用于计算 A1 的投标人数量 X = ${calculationResults.remainingForA1.length}</strong></p>`;
    step1Html += `<p><strong>剩余投标人：</strong>${calculationResults.remainingForA1.map(b => `${b.name}(${b.price})`).join(', ')}</p>`;
    
    step1Div.innerHTML = step1Html;

    // 第 2 步结果
    const step2Div = document.getElementById('step2Result');
    const sumA1 = calculationResults.remainingForA1.reduce((s, b) => s + b.price, 0).toFixed(4);
    step2Div.innerHTML = `
        <p>A1 = (剩余 X 个报价之和) / X</p>
        <p>A1 = ${sumA1} / ${calculationResults.remainingForA1.length} = <strong>${calculationResults.A1.toFixed(4)} 万元</strong></p>
    `;

    // 第 3 步结果
    const step3Div = document.getElementById('step3Result');
    step3Div.innerHTML = `
        <p>区间下限 = A1 × (1 + w1) = ${calculationResults.A1.toFixed(4)} × (1 ${params.w1 >= 0 ? '+' : '-'} ${Math.abs(params.w1)}) = <strong>${calculationResults.intervalLower.toFixed(4)} 万元</strong></p>
        <p>区间上限 = A1 × (1 + w2) = ${calculationResults.A1.toFixed(4)} × (1 ${params.w2 >= 0 ? '+' : '-'} ${Math.abs(params.w2)}) = <strong>${calculationResults.intervalUpper.toFixed(4)} 万元</strong></p>
        <p class="warning"><strong>合理报价区间：(${calculationResults.intervalLower.toFixed(4)}, ${calculationResults.intervalUpper.toFixed(4)})，不含边界</strong></p>
    `;

    // 第 4 步结果
    const step4Div = document.getElementById('step4Result');
    const validNames = calculationResults.validBidders.map(b => b.name).join(', ');
    step4Div.innerHTML = `
        <p>筛选报价在区间 (${calculationResults.intervalLower.toFixed(4)}, ${calculationResults.intervalUpper.toFixed(4)}) 内的投标人：</p>
        <p><strong>有效投标人：</strong>${validNames}</p>
        <p><strong>有效投标人数量：</strong>${calculationResults.validBidders.length} 个</p>
    `;

    // 第 5 步结果
    const step5Div = document.getElementById('step5Result');
    const sumA2 = calculationResults.validBidders.reduce((s, b) => s + b.price, 0).toFixed(4);
    step5Div.innerHTML = `
        <p>A2 = (有效投标人评标价之和) / 有效投标人个数</p>
        <p>A2 = ${sumA2} / ${calculationResults.validBidders.length} = <strong>${calculationResults.A2.toFixed(4)} 万元</strong></p>
    `;

    // 第 6 步结果
    const step6Div = document.getElementById('step6Result');
    step6Div.innerHTML = `
        <p>Pbase = A2 × (1 + C) = ${calculationResults.A2.toFixed(4)} × (1 ${params.C >= 0 ? '+' : '-'} ${Math.abs(params.C)}) = <strong>${calculationResults.Pbase.toFixed(4)} 万元</strong></p>
    `;

    // 第 7 步结果
    const step7Div = document.getElementById('step7Result');
    step7Div.innerHTML = `
        <p>得分公式：得分 i = ${params.maxScore} - ${params.maxScore} × n × |Pi - Pbase| / Pbase</p>
        <p>其中：Pi ≥ Pbase 时，n = ${params.n1}；Pi < Pbase 时，n = ${params.n2}</p>
    `;

    // 最优投标价格预测
    const optimalDiv = document.getElementById('optimalPriceResult');
    
    // 获取投标总价
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || null;
    
    // 计算最优价格区间
    let optimalPrice1 = calculationResults.Pbase * (1 + params.w2 * 0.3);
    let optimalPrice2 = calculationResults.Pbase * (1 + params.w2 * 0.2);
    let optimalPrice3 = calculationResults.Pbase * (1 + params.w1 * 0.3);
    
    // 策略 2：等于基准价（得满分）
    let perfectPrice = calculationResults.Pbase;
    
    // 如果输入了投标总价，确保推荐价格不超过投标总价
    if (totalPrice) {
        if (optimalPrice1 > totalPrice) optimalPrice1 = totalPrice;
        if (optimalPrice2 > totalPrice) optimalPrice2 = totalPrice;
        if (optimalPrice3 > totalPrice) optimalPrice3 = totalPrice;
        if (perfectPrice > totalPrice) perfectPrice = totalPrice;
    }
    
    // 预测得分
    const score1 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice1 - calculationResults.Pbase) / calculationResults.Pbase;
    const score2 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice2 - calculationResults.Pbase) / calculationResults.Pbase;
    const score3 = params.maxScore - params.maxScore * params.n2 * Math.abs(optimalPrice3 - calculationResults.Pbase) / calculationResults.Pbase;
    
    let optimalHtml = `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">📊 最优投标价格建议</h4>
            
            <div style="margin-bottom: 15px;">
                <p style="color: #666; margin-bottom: 8px;"><strong>当前基准价：</strong><span style="color: #1976d2; font-size: 18px; font-weight: bold;">${calculationResults.Pbase.toFixed(4)} 万元</span></p>
                <p style="color: #666; font-size: 13px;">注：基准价是根据所有有效投标人的报价计算得出，实际投标时其他投标人的报价是保密的</p>
            </div>

            <div style="background: #fff3e0; padding: 12px; border-radius: 5px; border-left: 4px solid #ff9800; margin-bottom: 15px;">
                <p style="color: #e65100; font-weight: bold; margin-bottom: 8px;">⚠️ 重要提示：</p>
                <p style="color: #555; font-size: 13px; line-height: 1.6;">
                    由于其他投标人的报价是保密的，您看到的基准价是基于当前输入数据计算的<strong>预测值</strong>。
                    实际投标时，需要根据对竞争对手的预估来调整报价策略。
                </p>
            </div>

            <div style="margin-bottom: 15px;">
                <h5 style="color: #2e7d32; margin-bottom: 10px;">🎯 推荐报价策略：</h5>
                
                ${totalPrice ? `<div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #4caf50;">
                    <p style="color: #2e7d32; font-size: 13px; margin: 0;">
                        ✅ <strong>投标总价限制：</strong>您的报价不能超过 <strong>${totalPrice.toFixed(2)} 万元</strong>
                    </p>
                </div>` : ''}
                
                <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; margin-bottom: 8px;">
                    <p style="color: #1b5e20; font-weight: bold; margin-bottom: 5px;">⭐ 最优推荐：略低于基准价</p>
                    <p style="color: #2e7d32; font-size: 14px; margin-bottom: 8px;">
                        <strong>推荐价格：${optimalPrice2.toFixed(4)} 万元</strong>${optimalPrice2 >= totalPrice ? '（已达到投标总价上限）' : '（低于基准价约 2%）'}
                    </p>
                    <p style="color: #555; font-size: 13px;">
                        预计得分：<strong style="color: #4caf50;">${score2.toFixed(3)} 分</strong><br>
                        优势：利用低价区扣分系数 n2=0.5 的优势，在价格略低的情况下获得较高分数
                    </p>
                </div>

                <div style="background: #e3f2fd; padding: 12px; border-radius: 5px; margin-bottom: 8px;">
                    <p style="color: #0d47a1; font-weight: bold; margin-bottom: 5px;">💎 完美匹配：等于基准价</p>
                    <p style="color: #1976d2; font-size: 14px; margin-bottom: 8px;">
                        <strong>推荐价格：${perfectPrice.toFixed(4)} 万元</strong>${perfectPrice >= totalPrice ? '（已达到投标总价上限）' : ''}
                    </p>
                    <p style="color: #555; font-size: 13px;">
                        预计得分：<strong style="color: #4caf50;">100.000 分</strong>（满分）<br>
                        说明：如果能准确预测基准价，此价格可获得满分，但难度较大
                    </p>
                </div>

                <div style="background: #f3e5f5; padding: 12px; border-radius: 5px;">
                    <p style="color: #4a148c; font-weight: bold; margin-bottom: 5px;">📈 价格区间建议</p>
                    <table style="width: 100%; margin-top: 8px; font-size: 13px;">
                        <tr style="background: white;">
                            <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>策略</strong></td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>报价 (万元)</strong></td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>预计得分</strong></td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>与基准价差</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;">低于 1%</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #1976d2;">${optimalPrice1.toFixed(4)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #4caf50;">${score1.toFixed(3)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;">-${(calculationResults.Pbase - optimalPrice1).toFixed(4)}</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>低于 2% ⭐</strong></td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #1976d2; font-weight: bold;">${optimalPrice2.toFixed(4)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #4caf50; font-weight: bold;">${score2.toFixed(3)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;">-${(calculationResults.Pbase - optimalPrice2).toFixed(4)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;">低于 3%</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #1976d2;">${optimalPrice3.toFixed(4)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0; color: #4caf50;">${score3.toFixed(3)}</td>
                            <td style="padding: 8px; border: 1px solid #e0e0e0;">-${(calculationResults.Pbase - optimalPrice3).toFixed(4)}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="background: #fff8e1; padding: 12px; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 15px;">
                <h5 style="color: #f57f17; margin-bottom: 8px;">💡 投标策略建议</h5>
                <ul style="color: #555; font-size: 13px; line-height: 1.8; padding-left: 20px;">
                    <li><strong>保守策略：</strong>报价在基准价的 97%-99% 之间，利用 n2=0.5 的优势，得分稳定在 98-99 分</li>
                    <li><strong>激进策略：</strong>如果能准确预测基准价，直接报基准价可获得满分</li>
                    <li><strong>风险提示：</strong>报价过高（>基准价）时，扣分系数 n1=1，失分较快</li>
                    <li><strong>竞争分析：</strong>如果有多个竞争对手，建议采用保守策略，略低于预测基准价</li>
                </ul>
            </div>
        </div>
    `;
    
    optimalDiv.innerHTML = optimalHtml;

    // 填充结果表格
    const tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = '';

    // 按得分从高到低排序
    const sortedResults = [...calculationResults.allResults].sort((a, b) => b.score - a.score);

    sortedResults.forEach((result, index) => {
        const tr = document.createElement('tr');
        if (result.isValid) {
            tr.className = 'highlight';
        }
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${result.name}</strong></td>
            <td>${result.price.toFixed(4)}</td>
            <td>${result.isValid ? '✅ 是' : '❌ 否'}</td>
            <td>${result.diff.toFixed(4)}</td>
            <td>${result.n}</td>
            <td><strong style="color: ${result.score >= 60 ? '#4caf50' : '#f44336'}">${result.score.toFixed(3)}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    // 填充关键结果摘要
    document.getElementById('summaryA1').textContent = calculationResults.A1.toFixed(4) + ' 万元';
    document.getElementById('summaryInterval').textContent = 
        `${calculationResults.intervalLower.toFixed(2)} ~ ${calculationResults.intervalUpper.toFixed(2)}`;
    document.getElementById('summaryPbase').textContent = calculationResults.Pbase.toFixed(4) + ' 万元';
    document.getElementById('summaryValidCount').textContent = calculationResults.validBidders.length + '个';

    // 滚动到结果区域
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' });
}

function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
// Initialize particles background
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50; // Adjust for performance

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 15 + 10}s`; // 10-25s
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particlesContainer.appendChild(particle);
    }
}

// Chart instances
let allocationChart, efficientFrontierChart, backtestChart;

// Function to create/update Allocation Chart (Pie/Doughnut)
function createAllocationChart(assets) {
    const ctx = document.getElementById('allocationChart').getContext('2d');
    if (allocationChart) allocationChart.destroy();

    const labels = assets.map(a => a.symbol.replace('-USD', ''));
    const data = assets.map(a => (a.weight * 100).toFixed(1));
    const colors = [
        '#3498DB', '#2ECC71', '#9B59B6', '#F1C40F', '#E67E22',
        '#1ABC9C', '#C0392B', '#7F8C8D', '#D35400', '#2C3E50'
    ]; // Mais cores profissionais

    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'var(--color-border)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'var(--color-text-primary)'
                    }
                },
                datalabels: { // Using chartjs-plugin-datalabels
                    color: 'var(--color-text-primary)',
                    formatter: (value) => `${value}%`,
                    font: {
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `${context.parsed}%`;
                            }
                            return label;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Function to create/update Efficient Frontier Chart
function createEfficientFrontierChart(dataPoints, optimalPoint) {
    const ctx = document.getElementById('efficientFrontierChart').getContext('2d');
    if (efficientFrontierChart) efficientFrontierChart.destroy();

    efficientFrontierChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Fronteira Eficiente',
                data: dataPoints, // {x: volatility, y: return}
                backgroundColor: 'rgba(52, 152, 219, 0.6)', // Azul suave
                borderColor: 'var(--color-accent-blue)',
                borderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5
            },
            {
                label: 'Portfólio Otimizado',
                data: [optimalPoint], // {x: volatility, y: return}
                backgroundColor: 'var(--color-accent-green)', // Verde suave
                borderColor: 'var(--color-accent-green)',
                borderWidth: 2,
                pointRadius: 8,
                pointStyle: 'star',
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--color-text-primary)'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            if (context.parsed) {
                                return `${label} - Retorno: ${(context.parsed.y * 100).toFixed(2)}%, Volatilidade: ${(context.parsed.x * 100).toFixed(2)}%`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Volatilidade Anualizada',
                        color: 'var(--color-text-primary)'
                    },
                    ticks: {
                        callback: value => `${(value * 100).toFixed(0)}%`,
                        color: 'var(--color-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Retorno Anualizado',
                        color: 'var(--color-text-primary)'
                    },
                    ticks: {
                        callback: value => `${(value * 100).toFixed(0)}%`,
                        color: 'var(--color-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Function to create/update Backtesting Performance Chart
function createBacktestChart(dates, portfolioReturns, benchmarkReturns) {
    const ctx = document.getElementById('backtestChart').getContext('2d');
    if (backtestChart) backtestChart.destroy();

    backtestChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Portfólio Otimizado',
                data: portfolioReturns,
                borderColor: 'var(--color-accent-green)',
                backgroundColor: 'rgba(46, 204, 113, 0.2)', // Verde suave
                borderWidth: 2,
                fill: true,
                tension: 0.3
            },
            {
                label: 'Benchmark (Bitcoin)',
                data: benchmarkReturns, // Placeholder for a benchmark like BTC
                borderColor: 'var(--color-accent-blue)', // Azul suave
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--color-text-primary)'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Data',
                        color: 'var(--color-text-primary)'
                    },
                    ticks: {
                        color: 'var(--color-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Retorno Acumulado',
                        color: 'var(--color-text-primary)'
                    },
                    ticks: {
                        callback: value => `${(value * 100).toFixed(0)}%`,
                        color: 'var(--color-text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Function to update Portfolio Table
function createPortfolioTable(assets) {
    const tbody = document.getElementById('portfolioTable').querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows
    assets.forEach(asset => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${asset.symbol.replace('-USD', '')}</strong></td>
            <td>${(asset.weight * 100).toFixed(1)}%</td>
            <td>${(asset.annualReturn * 100).toFixed(1)}%</td>
            <td>${(asset.volatility * 100).toFixed(1)}%</td>
            <td>${asset.sharpeRatio.toFixed(2)}</td>
        `;
    });
}

// Function to update Metrics Table and Quick Overview
function updateMetrics(performanceMetrics, backtestResults) {
    // As métricas de performance serão ocultadas, mas a lógica de atualização é mantida
    // caso decida reexibi-las no futuro.
    if (document.getElementById('metric-annual-return')) {
        document.getElementById('metric-annual-return').innerText = `${(performanceMetrics.annualReturn * 100).toFixed(2)}%`;
        document.getElementById('metric-annual-volatility').innerText = `${(performanceMetrics.volatility * 100).toFixed(2)}%`;
        document.getElementById('metric-sharpe-ratio').innerText = performanceMetrics.sharpeRatio.toFixed(2);
        document.getElementById('metric-max-drawdown').innerText = `${(backtestResults.maxDrawdown * 100).toFixed(2)}%`;
        document.getElementById('metric-calmar-ratio').innerText = backtestResults.calmarRatio.toFixed(2);
    }


    // Update Quick Overview (now integrated into Allocation Card)
    document.getElementById('overview-return').innerText = `${(performanceMetrics.annualReturn * 100).toFixed(1)}%`;
    document.getElementById('overview-volatility').innerText = `${(performanceMetrics.volatility * 100).toFixed(1)}%`;
    document.getElementById('overview-sharpe').innerText = performanceMetrics.sharpeRatio.toFixed(2);
    // Placeholder for arbitrage alerts, update with real logic
    document.getElementById('overview-arbitrage-alerts').innerText = '5 Ativos'; // Example
}

// Function to display simulated arbitrage opportunities
function displayArbitrageOpportunities() {
    const arbitrageContainer = document.getElementById('arbitragePrices');
    if (!arbitrageContainer) return; // Safeguard if element not found
    arbitrageContainer.innerHTML = ''; // Clear previous content

    // Dados simulados de preços de criptomoedas em diferentes corretoras
    const cryptoPrices = [
        {
            symbol: 'BTC',
            binance: 68500,
            kraken: 68650,
            coinbase: 68700
        },
        {
            symbol: 'ETH',
            binance: 3500,
            kraken: 3510,
            coinbase: 3495
        },
        {
            symbol: 'SOL',
            binance: 150.20,
            kraken: 150.50,
            coinbase: 150.00
        }
    ];

    cryptoPrices.forEach(crypto => {
        const prices = [
            { exchange: 'Binance', price: crypto.binance },
            { exchange: 'Kraken', price: crypto.kraken },
            { exchange: 'Coinbase', price: crypto.coinbase }
        ];

        // Encontrar o melhor preço (mais alto para simular uma oportunidade de venda)
        let bestPrice = 0;
        let bestExchange = '';
        prices.forEach(p => {
            if (p.price > bestPrice) {
                bestPrice = p.price;
                bestExchange = p.exchange;
            }
        });

        // Calcular diferença e lucro estimado simulados
        const minPrice = Math.min(crypto.binance, crypto.kraken, crypto.coinbase);
        const maxPrice = Math.max(crypto.binance, crypto.kraken, crypto.coinbase);
        const differencePercent = ((maxPrice - minPrice) / minPrice) * 100;
        const estimatedProfit = (maxPrice - minPrice) * 10; // Exemplo: assuming 10 units for simplicity

        const arbitrageItem = document.createElement('div');
        arbitrageItem.classList.add('arbitrage-item');

        let pricesHtml = prices.map(p => `
            <div class="arbitrage-price-row ${p.exchange === bestExchange ? 'best-price' : ''}">
                <span class="exchange">${p.exchange}:</span>
                <span class="price">$${p.price.toFixed(2)}</span>
            </div>
        `).join('');

        arbitrageItem.innerHTML = `
            <h4>${crypto.symbol}/USDT</h4>
            ${pricesHtml}
            <div class="arbitrage-details">
                Diferença: <strong style="color: ${differencePercent > 0.5 ? 'var(--color-accent-green)' : 'var(--color-accent-red)'};">${differencePercent.toFixed(2)}%</strong><br>
                Lucro Líquido Estimado: <strong>$${estimatedProfit.toFixed(2)}</strong> (entre ${minPrice.toFixed(2)} e ${maxPrice.toFixed(2)})
            </div>
        `;
        arbitrageContainer.appendChild(arbitrageItem);
    });
}


// Placeholder for fetching data (replace with actual API calls to Python backend)
async function fetchPortfolioData(tickers, startDate, endDate, riskFreeRate, objective) {
    console.log("Simulando busca de dados e otimização...", { tickers, startDate, endDate, riskFreeRate, objective });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // --- SIMULATED DATA ---
    const simulatedAssets = [
        { symbol: 'BTC-USD', weight: 0.4, annualReturn: 0.35, volatility: 0.6, sharpeRatio: 0.5 },
        { symbol: 'ETH-USD', weight: 0.3, annualReturn: 0.30, volatility: 0.55, sharpeRatio: 0.45 },
        { symbol: 'BNB-USD', weight: 0.15, annualReturn: 0.25, volatility: 0.5, sharpeRatio: 0.4 },
        { symbol: 'SOL-USD', weight: 0.1, annualReturn: 0.28, volatility: 0.7, sharpeRatio: 0.35 },
        { symbol: 'ADA-USD', weight: 0.05, annualReturn: 0.15, volatility: 0.45, sharpeRatio: 0.2 }
    ];

    const simulatedPerformance = {
        annualReturn: 0.28,
        volatility: 0.48,
        sharpeRatio: 0.48
    };

    const simulatedBacktestDates = Array.from({length: 12}, (_, i) => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        return d.toISOString().split('T')[0];
    });
    const simulatedPortfolioReturns = [0.0, 0.05, 0.08, 0.15, 0.12, 0.20, 0.18, 0.25, 0.22, 0.30, 0.28, 0.35]; // Cumulative
    const simulatedBenchmarkReturns = [0.0, 0.03, 0.06, 0.10, 0.09, 0.15, 0.13, 0.20, 0.18, 0.25, 0.23, 0.30]; // Cumulative BTC

    const simulatedBacktestMetrics = {
        maxDrawdown: -0.15,
        calmarRatio: 1.8
    };

    const simulatedEfficientFrontierPoints = [
        { x: 0.3, y: 0.1 }, { x: 0.35, y: 0.15 }, { x: 0.4, y: 0.2 },
        { x: 0.45, y: 0.25 }, { x: 0.48, y: 0.28 }, { x: 0.5, y: 0.27 }
    ];
    const simulatedOptimalPoint = { x: 0.48, y: 0.28 };

    // Call functions to update UI with simulated data
    createAllocationChart(simulatedAssets);
    createPortfolioTable(simulatedAssets);
    updateMetrics(simulatedPerformance, simulatedBacktestMetrics);
    createEfficientFrontierChart(simulatedEfficientFrontierPoints, simulatedOptimalPoint);
    createBacktestChart(simulatedBacktestDates, simulatedPortfolioReturns, simulatedBenchmarkReturns);
    
    console.log("Análise de portfólio simulada concluída.");
}

// Função para adicionar criptomoedas dinamicamente
function addCoinToSelection() {
    const coinSearchInput = document.getElementById('coinSearch');
    const tickersSelect = document.getElementById('tickers');
    let coinSymbol = coinSearchInput.value.trim().toUpperCase();

    if (!coinSymbol) {
        alert('Por favor, digite o símbolo da criptomoeda (ex: BTC, ETH).');
        return;
    }

    // Adicionar "-USD" se não estiver presente para simular o formato de ticker
    if (!coinSymbol.endsWith('-USD')) {
        coinSymbol += '-USD';
    }

    // Verificar se a moeda já foi adicionada
    for (let i = 0; i < tickersSelect.options.length; i++) {
        if (tickersSelect.options[i].value === coinSymbol) {
            alert(`A criptomoeda ${coinSymbol.replace('-USD', '')} já está na lista.`);
            coinSearchInput.value = '';
            return;
        }
    }

    // Mapeamento simples para nome completo (pode ser expandido com uma API real)
    const coinNames = {
        'BTC-USD': 'Bitcoin (BTC)',
        'ETH-USD': 'Ethereum (ETH)',
        'BNB-USD': 'Binance Coin (BNB)',
        'ADA-USD': 'Cardano (ADA)',
        'SOL-USD': 'Solana (SOL)',
        'XRP-USD': 'XRP',
        'DOGE-USD': 'Dogecoin (DOGE)',
        'DOT-USD': 'Polkadot (DOT)',
        'LTC-USD': 'Litecoin (LTC)',
        'LINK-USD': 'Chainlink (LINK)'
    };

    const option = document.createElement('option');
    option.value = coinSymbol;
    option.textContent = coinNames[coinSymbol] || coinSymbol.replace('-USD', ''); // Use nome completo ou símbolo
    option.selected = true; // Selecionar a nova opção automaticamente
    tickersSelect.appendChild(option);

    coinSearchInput.value = ''; // Limpar o campo de pesquisa
    alert(`Criptomoeda ${coinSymbol.replace('-USD', '')} adicionada!`);
}

// Event Listener for Form Submission
document.getElementById('portfolioConfigForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    // Coletar tickers selecionados
    const tickersSelect = document.getElementById('tickers');
    const selectedTickers = Array.from(tickersSelect.options)
                               .filter(option => option.selected)
                               .map(option => option.value);

    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    const riskFreeRate = parseFloat(document.getElementById('risk_free_rate').value);
    const objective = document.getElementById('objective').value;

    if (selectedTickers.length === 0) {
        alert('Por favor, selecione pelo menos uma criptomoeda.');
        return;
    }

    fetchPortfolioData(selectedTickers, startDate, endDate, riskFreeRate, objective);
});


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    displayArbitrageOpportunities();
    // Set default dates
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    document.getElementById('end_date').value = today.toISOString().split('T')[0];
    document.getElementById('start_date').value = oneYearAgo.toISOString().split('T')[0];
    
    // Adicionar eventos para pesquisa de moedas
    document.getElementById('addCoinButton').addEventListener('click', addCoinToSelection);
    document.getElementById('coinSearch').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evitar submissão do formulário
            addCoinToSelection();
        }
    });

    // Preencher a lista de tickers com as opções padrão no carregamento
    const defaultTickers = [
        { value: 'BTC-USD', text: 'Bitcoin (BTC)' },
        { value: 'ETH-USD', text: 'Ethereum (ETH)' },
        { value: 'BNB-USD', text: 'Binance Coin (BNB)' },
        { value: 'ADA-USD', text: 'Cardano (ADA)' },
        { value: 'SOL-USD', text: 'Solana (SOL)' }
    ];

    const tickersSelect = document.getElementById('tickers');
    defaultTickers.forEach(coin => {
        const option = document.createElement('option');
        option.value = coin.value;
        option.textContent = coin.text;
        option.selected = true;
        tickersSelect.appendChild(option);
    });

    // Optionally run a default analysis on load
    document.getElementById('portfolioConfigForm').dispatchEvent(new Event('submit'));
});
instalar_e_carregar <- function(pacotes) {
  novos_pacotes <- pacotes[!(pacotes %in% installed.packages()[, "Package"])]
  if (length(novos_pacotes)) install.packages(novos_pacotes)
  sapply(pacotes, require, character.only = TRUE)
}

# Lista de pacotes necessários
pacotes <- c("tidyverse", "PortfolioAnalytics", "PerformanceAnalytics",
             "quantmod", "timetk")

# Instalar e carregar os pacotes
instalar_e_carregar(pacotes)
#####################################################
# Definindo as ações que comporão a carteira
tickers <- c("BTC-USD", "BNB-USD", "SOL-USD", "ETH-USD", "XRP-USD")

# Obtendo os preços ajustados das ações
library(quantmod)
library(dplyr)
library(purrr)

prices_raw <- getSymbols(
  tickers,
  src = 'yahoo',
  from = "2024-06-01",
  to = "2025-01-01",
  auto.assign = TRUE,
  warnings = FALSE,
)

prices <- prices_raw %>% map (~Ad(get(.))) %>%
reduce(merge) %>% `colnames<-`(tickers)
prices_monthly <- to.monthly(prices,indexAt = "lastof", OHLC = FALSE)
#############################
library(PerformanceAnalytics)
library(timetk)
library(tidyr)
library(ggplot2)

# Calculando retornos logarítmicos e removendo NAs
asset_returns_xts <- PerformanceAnalytics::Return.calculate(prices_monthly, method = "log") %>% 
  na.omit()

# Removendo o índice IBOV da lista de ativos
retorno_ativos <- asset_returns_xts[, tickers[1:5]]

# Convertendo o objeto xts em tibble e depois para formato longo
asset_returns_tbl <- asset_returns_xts %>%
  tk_tbl(rename_index = "Data") %>%
  pivot_longer(cols = -Data, names_to = "assets", values_to = "value")  # Corrigido aqui

# Plotando o gráfico de densidade dos retornos dos ativos e do índice Bovespa
grafico <- ggplot(asset_returns_tbl) +
  aes(x = value, fill = assets) +
  geom_density(alpha = 0.7) +
  scale_fill_brewer(palette = "Set1") +
  labs(
    title = "Densidade dos Retornos das cripomoedas e Bitcoin",
    x = "Retorno",
    y = "Densidade",
    fill = "Criptos"
  ) +
  theme_minimal(base_size = 15) +
  theme(
    plot.title = element_text(hjust = 0.5, face = "bold"),  # Centraliza e coloca em negrito
    axis.title.x = element_text(face = "bold"),
    axis.title.y = element_text(face = "bold"),
    legend.position = "bottom"
  )

# Exibindo o gráfico
print(grafico)

library(ggplot2)
library(RColorBrewer)

ggplot(asset_returns_tbl) +
  aes(x = "", y = value, fill = assets) +
  geom_boxplot() +
  scale_fill_brewer(palette = "OrRd", direction = 1) +
  labs(
    x = "Cripto",
    y = "Retornos",
    title = "Box Plot - Retorno das criptos",
    fill = "Criptos"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
    axis.title.y = element_text(face = "bold"),
    axis.title.x = element_text(face = "bold")
  )

############################################
# Instalar os pacotes necessários para otimização com ROI
install.packages("ROI")
install.packages("ROI.plugin.glpk")
install.packages("ROI.plugin.quadprog")
install.packages("ROI.plugin.deoptim")

# Depois de instalar, carregue os plugins
library(ROI)
library(ROI.plugin.glpk)
library(ROI.plugin.quadprog)
library(ROI.plugin.deoptim)
############################################
library(PortfolioAnalytics)
library(PerformanceAnalytics)
library(timetk)
library(quantmod)

# Especificando a carteira com os ativos
portf <- portfolio.spec(assets = colnames(retorno_ativos))

# Adicionando restrições
portf <- add.constraint(portf, type = "weight_sum", min_sum = 0.99, max_sum = 1.01)
portf <- add.constraint(portf, type = "long_only")
portf <- add.constraint(portf, type = "box", min = 0.01, max = 0.5)

# Adicionando objetivos: risco e retorno
portf <- add.objective(portf, type = "risk", name = "StdDev")
portf <- add.objective(portf, type = "return", name = "mean")

# Otimizando a carteira
opt_result <- optimize.portfolio(
  R = retorno_ativos,
  portfolio = portf,
  optimize_method = "ROI",
  maxSR = TRUE,
  trace = TRUE
)

# Extraindo os pesos
w <- extractWeights(opt_result)

# Calculando os retornos da carteira
portfolio_returns_xts <- PerformanceAnalytics::Return.portfolio(
  retorno_ativos,
  weights = w,
  type = "discrete",
  verbose = FALSE
) %>% `colnames<-`("CARTEIRA")

# Convertendo para data frame
portfolio_returns_df <- portfolio_returns_xts %>%
  tk_tbl(rename_index = "Data")
portfolio_returns_xts
###########################################
# Criando um data frame com os pesos extraídos da otimização
weights <- data.frame(tickers = colnames(retorno_ativos), weights = w, row.names = NULL)

# Gráfico de barras com ggplot2
ggplot(weights, aes(x = reorder(tickers, weights), y = weights, fill = tickers)) +
  geom_col(color = "black", show.legend = FALSE) +
  theme_minimal(base_size = 14) +
  theme(
    axis.text.x = element_text(angle = 90, hjust = 1),
    plot.title = element_text(hjust = 0.5, size = 20, face = "bold"),
    plot.subtitle = element_text(hjust = 0.5, size = 16),
    legend.position = "none"
  ) +
  scale_fill_viridis_d() +
  labs(
    title = "Distribuição dos Pesos das Criptos",
    x = "Criptos",
    y = "Pesos"
  ) +
  coord_flip()
  #############################################
  # Combinando retornos dos ativos e da carteira em um único dataframe
comparacao <- cbind(asset_returns_xts, portfolio_returns_xts) %>%
  tk_tbl(rename_index = "Data") %>%
  pivot_longer(-Data, names_to = "assets", values_to = "value")

# Filtrando apenas carteira e IBOV para o gráfico
comp_mkt <- comparacao %>%
  filter(assets %in% c("BTC.USD", "CARTEIRA")) %>%
  ggplot() +
  aes(x = Data, y = value, colour = assets) +
  geom_line() +
  scale_color_hue(direction = 1) +
  labs(
    title = "Carteira VS Índice do mercado - Jun/24 - Dez/24",
    x = "Data",
    y = "Retornos",
    colour = "Criptos"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
    axis.title.y = element_text(face = "bold"),
    axis.title.x = element_text(face = "bold")
  )

# Exibir gráfico
print(comp_mkt)
######################
# Calculando média e desvio padrão
mean_value <- mean(portfolio_returns_df$CARTEIRA, na.rm = TRUE)
sd_value <- sd(portfolio_returns_df$CARTEIRA, na.rm = TRUE)

# Classificando os retornos por faixa (inferior, central, superior)
portfolio_returns_df %>%
  mutate(
    faixa_inferior = if_else(CARTEIRA < (mean_value - sd_value), CARTEIRA, as.numeric(NA)),
    faixa_superior = if_else(CARTEIRA > (mean_value + sd_value), CARTEIRA, as.numeric(NA)),
    faixa_central = if_else(CARTEIRA >= (mean_value - sd_value) & CARTEIRA <= (mean_value + sd_value), CARTEIRA, as.numeric(NA))
  ) %>%
  ggplot() +
  geom_point(aes(x = Data, y = faixa_inferior), color = "red") +
  geom_point(aes(x = Data, y = faixa_superior), color = "green") +
  geom_point(aes(x = Data, y = faixa_central), color = "blue") +
  geom_hline(yintercept = (mean_value + sd_value), color = "purple", linetype = "dotted") +
  geom_hline(yintercept = (mean_value - sd_value), color = "purple", linetype = "dotted") +
  geom_hline(yintercept = mean_value, color = "gray", linetype = "dashed") + # Linha da média
  labs(
    x = "Data",
    y = "Retornos",
    title = "Distribuição padronizada - Portfólio",
    color = "Cripto"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold", hjust = 0.5),
    axis.title.y = element_text(face = "bold"),
    axis.title.x = element_text(face = "bold")
  )
  ############################
  # Criar o objeto de portfólio
port_specr <- portfolio.spec(assets = colnames(asset_returns_xts))

# Adicionar restrições - apenas posições compradas
port_specr <- add.constraint(port_specr, type = "long_only")

# Restrição para a soma dos pesos (full investment)
port_specr <- add.constraint(port_specr, type = "weight_sum", min_sum = 0.99, max_sum = 1.01)

# Adicionar a função objetivo - maximizar o retorno esperado
port_specr <- add.objective(port_specr, type = "return", name = "mean")

# Adicionar a função objetivo - minimizar o risco (desvio padrão)
port_specr <- add.objective(port_specr, type = "risk", name = "StdDev")

# Adicionar a função objetivo - minimizar a contribuição marginal do risco
port_specr <- add.objective(
  port_specr,
  type = "risk_budget",
  name = "StdDev",
  min_prisk = 0.05,
  max_prisk = 0.1
)

# Gerar carteiras aleatórias com o método simplex
rp <- random_portfolios(port_specr, permutations = 50, rp_method = "simplex")

# Otimização com rebalanceamento mensal
opt_rebal <- optimize.portfolio.rebalancing(
  R = asset_returns_xts,
  portfolio = port_specr,
  optimize_method = "random",
  rp = rp,
  trace = TRUE,
  search_size = 1000,
  rebalance_on = "months",
  training_period = 6,
  rolling_window = 6,
  maxSR = TRUE
)

class(asset_returns_xts)
head(index(asset_returns_xts))  # Deve retornar datas

# Imprimir resultados da otimização
print(opt_rebal)
############################
# Extraindo os pesos dos ativos ao longo do tempo
weights_xts <- extractWeights(opt_rebal)

# Convertendo os pesos para um data frame
weights_df <- weights_xts %>%
  tk_tbl(preserve_index = TRUE, rename_index = "Date")

# Colocando o data frame em formato longo (long format)
weights_long_df <- weights_df %>%
  pivot_longer(cols = -Date, names_to = "Asset", values_to = "Weight")

# Gerando o gráfico interativo com plotly
plotly::ggplotly(
  ggplot(weights_long_df) +
    aes(x = Date, y = Weight, colour = Asset) +
    geom_smooth(se = FALSE) +
    scale_fill_hue(direction = 1) +
    labs(
      x = "Data",
      y = "Peso",
      title = "Peso das criptos rebalanceados ao longo do tempo",
      colour = "Criptos"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(size = 16, face = "bold", hjust = 0.5)
    )
)
######################
#definido a taxa livre de risco
rf_monthly <- 0.0468

# Criar uma função de Sharpe Ratio com Rf diferente de 0
custom_sharpe <- function(R, weights) {
  port_returns <- Return.portfolio(R, weights = weights)
  PerformanceAnalytics::SharpeRatio(port_returns, Rf = rf_monthly, FUN = "StdDev")
}

print(port_specr)
# Adicionar como objetivo customizado
port_specr <- add.objective(
  port_specr,
  type = "risk",
  name = "custom_sharpe"
)

#####################################################
# Calculando a fronteira eficiente
frontier <- create.EfficientFrontier(
  R = asset_returns_xts,
  portfolio = port_specr,
  type = "mean-StdDev"
)

# Plotando a fronteira eficiente
chart.EfficientFrontier(
  frontier,
  match.col = "StdDev",
  n.portfolios = 50,
  main = "Fronteira Eficiente"
)



################testes##########################
# Subtrair taxa livre de risco dos retornos (ajuste direto)
asset_returns_excess <- asset_returns_xts - rf_monthly

# Atualize a especificação (não adicione "custom_sharpe")
port_specr <- portfolio.spec(assets = colnames(asset_returns_xts))
port_specr <- add.constraint(port_specr, type = "weight_sum", min_sum = 0.99, max_sum = 1.01)
port_specr <- add.constraint(port_specr, type = "long_only")
port_specr <- add.constraint(port_specr, type = "box", min = 0.05, max = 1)
port_specr <- add.objective(port_specr, type = "risk", name = "StdDev")
port_specr <- add.objective(port_specr, type = "return", name = "mean")

# Recalcular a fronteira com retornos em excesso
frontier <- create.EfficientFrontier(
  R = asset_returns_excess,
  portfolio = port_specr,
  type = "mean-StdDev"
)

chart.EfficientFrontier(
  frontier,
  match.col = "StdDev",
  n.portfolios = 50,
  main = "Fronteira Eficiente (com retorno em excesso)"
)

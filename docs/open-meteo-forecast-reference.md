# Referência de previsão diária — Open-Meteo

Consulta realizada em 27/08/2026 para suportar cartões de previsão diária no Fly.IA.

- A API de previsão oferece até 16 dias de horizonte através de `forecast_days`.
- As variáveis diárias exigem `timezone` e incluem `weather_code`, `temperature_2m_min`, `temperature_2m_max` e `precipitation_probability_max`.
- O intervalo de datas pode ser delimitado por `start_date` e `end_date` no formato ISO 8601.
- Para uma data ou intervalo específicos, `start_date` e `end_date` não podem ser combinados com `forecast_days`; o Smart Fly usa o intervalo de datas e limita previamente a consulta a 16 dias.
- Em 27/08/2026, o endpoint aceitou datas até `2026-09-11`. A tentativa de terminar em `2026-09-12` respondeu HTTP 400 com `"Parameter 'end_date' is out of allowed range"`; por isso o último dia do horizonte é solicitado isoladamente.

Fonte: [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs).

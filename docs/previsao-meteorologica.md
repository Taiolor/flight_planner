# Previsão meteorológica nos cards do Calendário

Os cards usam a [documentação oficial da Open-Meteo](https://open-meteo.com/en/docs) como referência de contrato. A fonte oferece previsão de até 16 dias e séries horárias para `weather_code`, `temperature_2m`, `precipitation_probability`, `precipitation`, `wind_speed_10m` e `wind_gusts_10m`.

O Smart Fly consulta somente coordenadas públicas conhecidas dos aeroportos suportados. Para cada trecho, a interface usa o horário mais próximo do voo e destaca chuva relevante quando a probabilidade é de pelo menos 70% ou a precipitação é de pelo menos 2 mm/h; vento forte é destacado a partir de 40 km/h ou rajadas de 45 km/h. Os alertas são contexto operacional, não previsão de impacto ou aconselhamento de segurança de voo.

# Telemetry Script Folder

This is the telemetry script folder. Here you can find scripts that can be used to stream metrics and schema-free documents (logs) to your favorite telemetry of log aggregation application.

## Available Scripts

### Stream Metrics to InfluxDB and Visualize in Grafana

**Script**: [influx_db_kpis.js](./influx_db_kpis.js)
**Grafana JSON Model**: [Grafana dashboard JSON model](assets/influx_db_kpis_grafana.json)

#### Description

Stream performance metrics to InfluxDB upon dissection of every HTTP API call. Enjoy the following dashboard in Grafana:
- API call latency and http response code over time (two panels)
- Aggregated latency and bandwidth across a time period (two panels)
![Grafana Dashboard](assets/grafana_dashboard.png)

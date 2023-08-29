// Influx DB

/*
 * TL;DR - Nothing do do here. This is an automatic script that feeds from the config.yaml's 
 * environment variables.
 * /

/*
 * Send HTTP API call KPIs to Influx DB & Grafana
 * ==========================================================
 * 
 * Description:
 * -----------
 * Send identity-aware API call KPIs to Influx DB and visualize in Grafana.
 * KPIs: Latency, bandwidth, status code
 * Identity data: namespace, source and destination service labels and IPs
 * Available charts: 
 * - Latency, bandwidth and status codes over time
 * - Aggregated latency and bandwidth per: 1m, 1h, 24h
 * 
 * Environment Variables:
 * ----------------------
 * INFLUXDB_URL:    <influxdb-url>
 * INFLUXDB_TOKEN:  <influxdb-token>
 * INFLUXDB_ORG:    <influxdb-org>
 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder
 * - Make sure the environment variables are present in the config file
 * - Build a Grafana dashboard based on the JSON model
 * 
 * Assets:
 * -------
 * ./influx_db_kpis_grafana.json - Grafana's dashboard JSON model
*/

var infBucket   = "Kubeshark";
var infMeasurement = "callKPIs";
var ACTIVE     = true;  // change to false to disable this script

if (!env.INFLUXDB_URL || !env.INFLUXDB_TOKEN || !env.INFLUXDB_ORG ){
    console.error("InfluxDB script will not run: One or more of the mandatory InfluxDB variables is missing. No point in continuing. Exiting script.");
    ACTIVE = false;
}

function onItemCaptured(data) {
    if (!ACTIVE) return;
    try{
        if (data.protocol.name !== "http") return;
        
        var metrics = { 
            latency:    data.elapsedTime, 
            status:     data.response.status,
            bandwidth:  data.requestSize + data.responseSize
        };
        var tags = { 
            dst_name:   data.dst.name ? data.dst.name : "unresolved", 
            dst_ip:     data.dst.ip, 
            dst_port:   data.dst.port,
            dst_ns:     data.dst.namespace ? data.dst.namespace : "unresolved",
            src_name:   data.src.name ? data.src.name : "unresolved", 
            src_ip:     data.src.ip,
            src_ns:     data.src.namespace ? data.src.namespace : "unresolved",
            path:       data.request.path,
            node:       data.node.name
        };

        // send KPI metrics on every API call
        vendor.influxdb(
            env.INFLUXDB_URL,
            env.INFLUXDB_TOKEN,
            env.INFLUXDB_ORG,     
            infBucket,  
            infMeasurement , 
            metrics,
            tags
                    
        ); 
//        console.log("Wrote:", JSON.stringify({"metrics":  metrics, "tags": tags, "data": data }));
    }
    catch (err){
        console.error("hookSendMetrics",err);
    }
}
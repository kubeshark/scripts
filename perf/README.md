### Panel JSON
```yaml
{
  "gridPos": {
    "h": 20,
    "w": 23,
    "x": 1,
    "y": 0
  },
  "id": 2,
  "libraryPanel": {
    "id": 1,
    "orgId": 1,
    "folderId": 0,
    "folderUid": "",
    "uid": "c89f66dc-7e19-4fff-adfb-30b181fd58d6",
    "name": "Pod Latency",
    "kind": 1,
    "type": "timeseries",
    "description": "",
    "model": {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "description": "",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "microseconds",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "µs",
          "unitScale": true
        },
        "overrides": []
      },
      "gridPos": {
        "h": 20,
        "w": 23,
        "x": 1,
        "y": 0
      },
      "id": 2,
      "options": {
        "legend": {
          "calcs": [
            "mean",
            "min",
            "max",
            "stdDev"
          ],
          "displayMode": "table",
          "placement": "bottom",
          "showLegend": true
        },
        "timezone": [
          "browser"
        ],
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "disableTextWrap": false,
          "editorMode": "code",
          "exemplar": false,
          "expr": "performance{s_namespace=~\"$namespace\",s_pod=~\"$pod\"}",
          "fullMetaSearch": false,
          "includeNullMetadata": true,
          "instant": true,
          "legendFormat": "{{s_pod}}({{s_namespace}}) ------------- {{s_path}}",
          "range": true,
          "refId": "A",
          "useBackend": false
        }
      ],
      "title": "Pod Latency",
      "transformations": [],
      "type": "timeseries"
    },
    "version": 16,
    "meta": {
      "folderName": "General",
      "folderUid": "",
      "connectedDashboards": 2,
      "created": "2024-11-05T12:19:38Z",
      "updated": "2024-11-05T13:28:37Z",
      "createdBy": {
        "avatarUrl": "/avatar/46d229b033af06a191ff2267bca9ae56",
        "id": 1,
        "name": "admin"
      },
      "updatedBy": {
        "avatarUrl": "/avatar/46d229b033af06a191ff2267bca9ae56",
        "id": 1,
        "name": "admin"
      }
    }
  },
  "title": "Pod Latency",
  "targets": [
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "disableTextWrap": false,
      "editorMode": "code",
      "exemplar": false,
      "expr": "performance{s_namespace=~\"$namespace\",s_pod=~\"$pod\"}",
      "fullMetaSearch": false,
      "includeNullMetadata": true,
      "instant": true,
      "legendFormat": "{{s_pod}}({{s_namespace}}) ------------- {{s_path}}",
      "range": true,
      "refId": "A",
      "useBackend": false
    }
  ],
  "options": {
    "tooltip": {
      "mode": "single",
      "sort": "none"
    },
    "legend": {
      "showLegend": true,
      "displayMode": "table",
      "placement": "bottom",
      "calcs": [
        "mean",
        "min",
        "max",
        "stdDev"
      ]
    },
    "timezone": [
      "browser"
    ]
  },
  "fieldConfig": {
    "defaults": {
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "linear",
        "barAlignment": 0,
        "lineWidth": 1,
        "fillOpacity": 0,
        "gradientMode": "none",
        "spanNulls": false,
        "insertNulls": false,
        "showPoints": "auto",
        "pointSize": 5,
        "stacking": {
          "mode": "none",
          "group": "A"
        },
        "axisPlacement": "auto",
        "axisLabel": "microseconds",
        "axisColorMode": "text",
        "axisBorderShow": false,
        "scaleDistribution": {
          "type": "linear"
        },
        "axisCenteredZero": false,
        "hideFrom": {
          "tooltip": false,
          "viz": false,
          "legend": false
        },
        "thresholdsStyle": {
          "mode": "off"
        }
      },
      "unitScale": true,
      "color": {
        "mode": "palette-classic"
      },
      "mappings": [],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {
            "color": "green",
            "value": null
          },
          {
            "color": "red",
            "value": 80
          }
        ]
      },
      "unit": "µs"
    },
    "overrides": []
  },
  "datasource": {
    "type": "prometheus",
    "uid": "prometheus"
  },
  "description": "",
  "transformations": [],
  "type": "timeseries"
}
```
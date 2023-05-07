
# Import as a New Grafana Dashboard

Adding a new dashboard to Grafana that visualizes the information in your network is a simple and straightforward process. Assuming you have all the prequisists in place, the process shouldn't take more than a few minutes to complete.

If it takes you more than a few minutes, [shoot us a note](https://kubeshark.co/beta) and we'll help you get going quickly.

The dashboard content provided in this repo is an example of what you can achieve. As Kubeshark provides 100% flexibility and abundance of information, you can pretty much build your own dashboard with information that matters to you.

## Prerequisites

Kubeshark uses InfluxDB as a time-series database to stores metrics. Then use InfluxDB as a data source to present dashboards in Grafana.

In this case, we assume:
1. Kubeshark Pro edition, scripting configuration ebaled and the relevant InfluxDB authentication information.
2. A Grafana instance is set up
3. An InfluxDB instance is set up and is set as a data source in the the Grafana instance

Read the TL;DR section if you'd like to complete anyone of the prerequisites. 

## Import a New Dashboard

Add a new dashboard by importing a JSON file. Find the `Import` action under `Dashboards`:
![Grafana Dashboard Import](grafana-dashboard-import.png)

Use the content of this file: `scripts/telemetry/assets/influx_db_kpis_grafana.json` which will be the cloned version of [this file](influx_db_kpis_grafana.json).

Make sure you select your InfluxDB instance as a data source:
![Select your InfluxDB Data Source](influxdb-data-source-grafana.png)

You should see your new dashboard in the Dashboard sections:
![New Grafana Dashboard](./new-grafana-dashboard.png)

## TL;DR

### Kubeshark, Pro Edition & Scripting
InfluxDB integration is a `Pro` edition feature. Kubeshark Pro edition is in Beta and is free of charge while in Beta. 

To upgrade Kubeshark to Pro, simply type `kubeshark pro` in your terminal. Once the `Pro` license is added to your configuration file, the following configuration elements are required:
```bash
license: FT7YKAYBAEDUY2LDMVXHGZIB76DAAAIDAECEIYLUME..7QY3OSKQF2JUJWZ66PC45JMOPJRN6SPGIFXQWSAA===
scripting:
    env:
        INFLUXDB_TOKEN:     DUv0ItR7LCtn42pCwMO..hQfdgCCy0Q==
        INFLUXDB_URL:       <instance-URL>
        INFLUXDB_BUCKET:    <your-bucket>
        INFLUXDB_ORG:       Kubeshark
    source: /path/to/your/kubeshark/scripts/folder
    watchScripts: true
```

This repository offers a complete and off-the-shelf script to start sending metrics to InfluxDB and visualize in Grafana.

The relevant script you'd need to put in your scripts folder mentioned in the configuration section as `scripting.source` is located here: `telemetry/influx_db_kpis.js`. This would be your local version of [this script](https://github.com/kubeshark/scripts/influx_db_kpis.js).

Clone the scripts repository and copy the right script to the right place:
```bash
git clone kubeshark/scripts
cd scripts
cp telemetry/influx_db_kpis.js /path/to/your/kubeshark/scripts/folder/
```
Once Kubeshark runs and identify the script in the scripts folder, metric will be sent to your InfluxDB instance.

### Set up a new InfluxDB Instance
#### Installation
There are many ways to install an InfluxDB instance that can be founde in [the documentation](https://docs.influxdata.com/influxdb/v2.7/install/). One simple example is using Homebrew:
```bash
brew update
brew install influxdb
influxd
```
#### API Token
Once you have your InfluxDB up and running, you need to create an organization and an API token. Make sure the organization's name is similar to the name that was porovided in the confuguration part (e.g. Kubeshark).

Generate an API token and take a not of it. You'll need it when setting up your Grafana dashboard.
![InfluxDB New Org and API Token](influxdb-org-token.png)

### Set up a new Grafana Instance
#### Installation
There are many ways to install a Grafana instance that can be founde in [the documentation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/). One simple example is using Homebrew:
```bash
brew update
brew install grafana
brew services start grafana
```
#### InfluxDB as a Data Source
Once your Grafana instance is up and running, make sure you add InfluxDB as a data source:
![Adding InfluxDB as a new Data Source in Grafana](grafana-influxdb-new-data-source.png)

### What further information I can visualize
Kubeshark provides protocol-level information related to any dissected L7 message in addition to complete Kuberenetes manifest information related to the involved pods. It sends metrics to InfluxDB from the schema-free document that is provided when a new message is dissected by the L7 hook: `onItemCaptured(data)`. 

You can simply use the following code to see what information is available:
```js
function onItemCaptured(data) {
    console.log(JSON.stringify(data));
}
```
Here's an example of the `data` document that is provided:
```json
{
    "dst": {
        "endpointSlice": {
            "metadata": {
                "annotations": {
                    "endpoints.kubernetes.io/last-change-trigger-time": "2023-05-07T21:33:29Z"
                },
                "creationTimestamp": "2023-05-07T21:29:31Z",
                "labels": {
                    "name": "catalogue"
                },
                "managedFields": [
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:metadata": {
                                "f:annotations": {
                                    ".": {},
                                    "f:endpoints.kubernetes.io/last-change-trigger-time": {}
                                },
                                "f:labels": {
                                    ".": {},
                                    "f:name": {}
                                }
                            },
                            "f:subsets": {}
                        },
                        "manager": "kube-controller-manager",
                        "operation": "Update",
                        "time": "2023-05-07T21:33:29Z"
                    }
                ],
                "name": "catalogue",
                "namespace": "sock-shop",
                "resourceVersion": "138187",
                "uid": "55cec7bb-6fca-42e7-89f3-808934ffaa8c"
            },
            "subsets": [
                {
                    "addresses": [
                        {
                            "ip": "10.244.0.73",
                            "nodeName": "mizu",
                            "targetRef": {
                                "kind": "Pod",
                                "name": "catalogue-7d77c68bcf-tjg5c",
                                "namespace": "sock-shop",
                                "uid": "62bfc3a2-942a-4f5b-9ff4-e6015fb6fea2"
                            }
                        }
                    ],
                    "ports": [
                        {
                            "port": 80,
                            "protocol": "TCP"
                        }
                    ]
                }
            ]
        },
        "ip": "10.244.0.73",
        "name": "catalogue",
        "namespace": "sock-shop",
        "pod": {
            "metadata": {
                "creationTimestamp": "2023-05-07T21:29:31Z",
                "generateName": "catalogue-7d77c68bcf-",
                "labels": {
                    "name": "catalogue",
                    "pod-template-hash": "7d77c68bcf"
                },
                "managedFields": [
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:metadata": {
                                "f:generateName": {},
                                "f:labels": {
                                    ".": {},
                                    "f:name": {},
                                    "f:pod-template-hash": {}
                                },
                                "f:ownerReferences": {
                                    ".": {},
                                    "k:{\"uid\":\"3de1b9be-03fd-4dbd-a3c3-93d25d5290b9\"}": {}
                                }
                            },
                            "f:spec": {
                                "f:containers": {
                                    "k:{\"name\":\"catalogue\"}": {
                                        ".": {},
                                        "f:args": {},
                                        "f:command": {},
                                        "f:image": {},
                                        "f:imagePullPolicy": {},
                                        "f:livenessProbe": {
                                            ".": {},
                                            "f:failureThreshold": {},
                                            "f:httpGet": {
                                                ".": {},
                                                "f:path": {},
                                                "f:port": {},
                                                "f:scheme": {}
                                            },
                                            "f:initialDelaySeconds": {},
                                            "f:periodSeconds": {},
                                            "f:successThreshold": {},
                                            "f:timeoutSeconds": {}
                                        },
                                        "f:name": {},
                                        "f:ports": {
                                            ".": {},
                                            "k:{\"containerPort\":80,\"protocol\":\"TCP\"}": {
                                                ".": {},
                                                "f:containerPort": {},
                                                "f:protocol": {}
                                            }
                                        },
                                        "f:readinessProbe": {
                                            ".": {},
                                            "f:failureThreshold": {},
                                            "f:httpGet": {
                                                ".": {},
                                                "f:path": {},
                                                "f:port": {},
                                                "f:scheme": {}
                                            },
                                            "f:initialDelaySeconds": {},
                                            "f:periodSeconds": {},
                                            "f:successThreshold": {},
                                            "f:timeoutSeconds": {}
                                        },
                                        "f:resources": {
                                            ".": {},
                                            "f:limits": {
                                                ".": {},
                                                "f:cpu": {},
                                                "f:memory": {}
                                            },
                                            "f:requests": {
                                                ".": {},
                                                "f:cpu": {},
                                                "f:memory": {}
                                            }
                                        },
                                        "f:securityContext": {
                                            ".": {},
                                            "f:capabilities": {
                                                ".": {},
                                                "f:add": {},
                                                "f:drop": {}
                                            },
                                            "f:readOnlyRootFilesystem": {},
                                            "f:runAsNonRoot": {},
                                            "f:runAsUser": {}
                                        },
                                        "f:terminationMessagePath": {},
                                        "f:terminationMessagePolicy": {}
                                    }
                                },
                                "f:dnsPolicy": {},
                                "f:enableServiceLinks": {},
                                "f:nodeSelector": {},
                                "f:restartPolicy": {},
                                "f:schedulerName": {},
                                "f:securityContext": {},
                                "f:terminationGracePeriodSeconds": {}
                            }
                        },
                        "manager": "kube-controller-manager",
                        "operation": "Update",
                        "time": "2023-05-07T21:29:31Z"
                    },
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:status": {
                                "f:conditions": {
                                    "k:{\"type\":\"ContainersReady\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    },
                                    "k:{\"type\":\"Initialized\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    },
                                    "k:{\"type\":\"Ready\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    }
                                },
                                "f:containerStatuses": {},
                                "f:hostIP": {},
                                "f:phase": {},
                                "f:podIP": {},
                                "f:podIPs": {
                                    ".": {},
                                    "k:{\"ip\":\"10.244.0.73\"}": {
                                        ".": {},
                                        "f:ip": {}
                                    }
                                },
                                "f:startTime": {}
                            }
                        },
                        "manager": "kubelet",
                        "operation": "Update",
                        "subresource": "status",
                        "time": "2023-05-07T21:33:29Z"
                    }
                ],
                "name": "catalogue-7d77c68bcf-tjg5c",
                "namespace": "sock-shop",
                "ownerReferences": [
                    {
                        "apiVersion": "apps/v1",
                        "blockOwnerDeletion": true,
                        "controller": true,
                        "kind": "ReplicaSet",
                        "name": "catalogue-7d77c68bcf",
                        "uid": "3de1b9be-03fd-4dbd-a3c3-93d25d5290b9"
                    }
                ],
                "resourceVersion": "138185",
                "uid": "62bfc3a2-942a-4f5b-9ff4-e6015fb6fea2"
            },
            "spec": {
                "containers": [
                    {
                        "args": [
                            "-port=80"
                        ],
                        "command": [
                            "/app"
                        ],
                        "image": "weaveworksdemos/catalogue:0.3.5",
                        "imagePullPolicy": "IfNotPresent",
                        "livenessProbe": {
                            "failureThreshold": 3,
                            "httpGet": {
                                "path": "/health",
                                "port": 80,
                                "scheme": "HTTP"
                            },
                            "initialDelaySeconds": 300,
                            "periodSeconds": 3,
                            "successThreshold": 1,
                            "timeoutSeconds": 1
                        },
                        "name": "catalogue",
                        "ports": [
                            {
                                "containerPort": 80,
                                "protocol": "TCP"
                            }
                        ],
                        "readinessProbe": {
                            "failureThreshold": 3,
                            "httpGet": {
                                "path": "/health",
                                "port": 80,
                                "scheme": "HTTP"
                            },
                            "initialDelaySeconds": 180,
                            "periodSeconds": 3,
                            "successThreshold": 1,
                            "timeoutSeconds": 1
                        },
                        "resources": {
                            "limits": {
                                "cpu": "200m",
                                "memory": "200Mi"
                            },
                            "requests": {
                                "cpu": "10m",
                                "memory": "10Mi"
                            }
                        },
                        "securityContext": {
                            "capabilities": {
                                "add": [
                                    "NET_BIND_SERVICE"
                                ],
                                "drop": [
                                    "all"
                                ]
                            },
                            "readOnlyRootFilesystem": true,
                            "runAsNonRoot": true,
                            "runAsUser": 10001
                        },
                        "terminationMessagePath": "/dev/termination-log",
                        "terminationMessagePolicy": "File",
                        "volumeMounts": [
                            {
                                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                                "name": "kube-api-access-2hjtb",
                                "readOnly": true
                            }
                        ]
                    }
                ],
                "dnsPolicy": "ClusterFirst",
                "enableServiceLinks": true,
                "nodeName": "mizu",
                "nodeSelector": {
                    "beta.kubernetes.io/os": "linux"
                },
                "preemptionPolicy": "PreemptLowerPriority",
                "priority": 0,
                "restartPolicy": "Always",
                "schedulerName": "default-scheduler",
                "securityContext": {},
                "serviceAccount": "default",
                "serviceAccountName": "default",
                "terminationGracePeriodSeconds": 30,
                "tolerations": [
                    {
                        "effect": "NoExecute",
                        "key": "node.kubernetes.io/not-ready",
                        "operator": "Exists",
                        "tolerationSeconds": 300
                    },
                    {
                        "effect": "NoExecute",
                        "key": "node.kubernetes.io/unreachable",
                        "operator": "Exists",
                        "tolerationSeconds": 300
                    }
                ],
                "volumes": [
                    {
                        "name": "kube-api-access-2hjtb",
                        "projected": {
                            "defaultMode": 420,
                            "sources": [
                                {
                                    "serviceAccountToken": {
                                        "expirationSeconds": 3607,
                                        "path": "token"
                                    }
                                },
                                {
                                    "configMap": {
                                        "items": [
                                            {
                                                "key": "ca.crt",
                                                "path": "ca.crt"
                                            }
                                        ],
                                        "name": "kube-root-ca.crt"
                                    }
                                },
                                {
                                    "downwardAPI": {
                                        "items": [
                                            {
                                                "fieldRef": {
                                                    "apiVersion": "v1",
                                                    "fieldPath": "metadata.namespace"
                                                },
                                                "path": "namespace"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "status": {
                "conditions": [
                    {
                        "lastTransitionTime": "2023-05-07T21:29:31Z",
                        "status": "True",
                        "type": "Initialized"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:33:29Z",
                        "status": "True",
                        "type": "Ready"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:33:29Z",
                        "status": "True",
                        "type": "ContainersReady"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:29:31Z",
                        "status": "True",
                        "type": "PodScheduled"
                    }
                ],
                "containerStatuses": [
                    {
                        "containerID": "docker://edfe369bb52370c88838f84e5ec711511e288dfa5f4c8aaa097e9ddb8662c2eb",
                        "image": "weaveworksdemos/catalogue:0.3.5",
                        "imageID": "docker-pullable://weaveworksdemos/catalogue@sha256:0147a65b7116569439eefb1a6dbed455fe022464ef70e0c3cab75bc4a226b39b",
                        "lastState": {},
                        "name": "catalogue",
                        "ready": true,
                        "restartCount": 0,
                        "started": true,
                        "state": {
                            "running": {
                                "startedAt": "2023-05-07T21:30:29Z"
                            }
                        }
                    }
                ],
                "hostIP": "192.168.64.4",
                "phase": "Running",
                "podIP": "10.244.0.73",
                "podIPs": [
                    {
                        "ip": "10.244.0.73"
                    }
                ],
                "qosClass": "Burstable",
                "startTime": "2023-05-07T21:29:31Z"
            }
        },
        "port": "80"
    },
    "elapsedTime": 2,
    "failed": false,
    "id": "192.168.64.4:8897/000000001497.pcap-0",
    "index": 0,
    "node": {
        "ip": "192.168.64.4",
        "name": "mizu"
    },
    "outgoing": false,
    "passed": false,
    "protocol": {
        "abbr": "HTTP",
        "backgroundColor": "#326de6",
        "fontSize": 12,
        "foregroundColor": "#ffffff",
        "layer4": "tcp",
        "longName": "Hypertext Transfer Protocol -- HTTP/1.1",
        "macro": "http",
        "name": "http",
        "ports": [
            "80",
            "443",
            "8080"
        ],
        "priority": 0,
        "referenceLink": "https://datatracker.ietf.org/doc/html/rfc2616",
        "version": "1.1"
    },
    "request": {
        "bodySize": 0,
        "cookies": {},
        "headers": {
            "Connection": "close",
            "Host": "catalogue"
        },
        "headersSize": -1,
        "httpVersion": "HTTP/1.1",
        "method": "GET",
        "path": "/catalogue/808a2de1-1aaa-4c25-a9b9-6612e8f29a38",
        "pathSegments": [
            "catalogue",
            "808a2de1-1aaa-4c25-a9b9-6612e8f29a38"
        ],
        "queryString": {},
        "targetUri": "/catalogue/808a2de1-1aaa-4c25-a9b9-6612e8f29a38",
        "url": "/catalogue/808a2de1-1aaa-4c25-a9b9-6612e8f29a38"
    },
    "requestSize": 100,
    "response": {
        "bodySize": 275,
        "content": {
            "encoding": "base64",
            "mimeType": "application/json; charset=utf-8",
            "size": 275,
            "text": "eyJpZCI6IjgwOGEyZGUxLTFhYWEtNGMyNS1hOWI5LTY2MTJlOGYyOWEzOCIsIm5hbWUiOiJDcm9zc2VkIiwiZGVzY3JpcHRpb24iOiJBIG1hdHVyZSBzb2NrLCBjcm9zc2VkLCB3aXRoIGFuIGFpciBvZiBub25jaGFsYW5jZS4iLCJpbWFnZVVybCI6WyIvY2F0YWxvZ3VlL2ltYWdlcy9jcm9zc18xLmpwZWciLCIvY2F0YWxvZ3VlL2ltYWdlcy9jcm9zc18yLmpwZWciXSwicHJpY2UiOjE3LjMyLCJjb3VudCI6NzM4LCJ0YWciOlsiYmx1ZSIsInJlZCIsImFjdGlvbiIsImZvcm1hbCJdfQo="
        },
        "cookies": {},
        "headers": {
            "Content-Length": "275",
            "Content-Type": "application/json; charset=utf-8",
            "Date": "Sun, 07 May 2023 21:36:40 GMT"
        },
        "headersSize": -1,
        "httpVersion": "HTTP/1.1",
        "redirectURL": "",
        "status": 200,
        "statusText": "OK"
    },
    "responseSize": 418,
    "src": {
        "endpointSlice": {
            "metadata": {
                "annotations": {
                    "endpoints.kubernetes.io/last-change-trigger-time": "2023-05-07T21:30:17Z"
                },
                "creationTimestamp": "2023-05-07T21:29:32Z",
                "labels": {
                    "name": "front-end"
                },
                "managedFields": [
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:metadata": {
                                "f:annotations": {
                                    ".": {},
                                    "f:endpoints.kubernetes.io/last-change-trigger-time": {}
                                },
                                "f:labels": {
                                    ".": {},
                                    "f:name": {}
                                }
                            },
                            "f:subsets": {}
                        },
                        "manager": "kube-controller-manager",
                        "operation": "Update",
                        "time": "2023-05-07T21:30:17Z"
                    }
                ],
                "name": "front-end",
                "namespace": "sock-shop",
                "resourceVersion": "137831",
                "uid": "edaf9764-8c74-4227-9d33-0b81d42361ae"
            },
            "subsets": [
                {
                    "addresses": [
                        {
                            "ip": "10.244.0.148",
                            "nodeName": "mizu",
                            "targetRef": {
                                "kind": "Pod",
                                "name": "front-end-7d89d49d6b-n96mr",
                                "namespace": "sock-shop",
                                "uid": "ef550604-fea9-4a47-b8ab-53ef1904698b"
                            }
                        }
                    ],
                    "ports": [
                        {
                            "port": 8079,
                            "protocol": "TCP"
                        }
                    ]
                }
            ]
        },
        "ip": "10.244.0.148",
        "name": "front-end",
        "namespace": "sock-shop",
        "pod": {
            "metadata": {
                "creationTimestamp": "2023-05-07T21:29:32Z",
                "generateName": "front-end-7d89d49d6b-",
                "labels": {
                    "name": "front-end",
                    "pod-template-hash": "7d89d49d6b"
                },
                "managedFields": [
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:metadata": {
                                "f:generateName": {},
                                "f:labels": {
                                    ".": {},
                                    "f:name": {},
                                    "f:pod-template-hash": {}
                                },
                                "f:ownerReferences": {
                                    ".": {},
                                    "k:{\"uid\":\"6bda5922-fdce-4d40-8bc5-25d6a9cc3911\"}": {}
                                }
                            },
                            "f:spec": {
                                "f:containers": {
                                    "k:{\"name\":\"front-end\"}": {
                                        ".": {},
                                        "f:env": {
                                            ".": {},
                                            "k:{\"name\":\"SESSION_REDIS\"}": {
                                                ".": {},
                                                "f:name": {},
                                                "f:value": {}
                                            }
                                        },
                                        "f:image": {},
                                        "f:imagePullPolicy": {},
                                        "f:livenessProbe": {
                                            ".": {},
                                            "f:failureThreshold": {},
                                            "f:httpGet": {
                                                ".": {},
                                                "f:path": {},
                                                "f:port": {},
                                                "f:scheme": {}
                                            },
                                            "f:initialDelaySeconds": {},
                                            "f:periodSeconds": {},
                                            "f:successThreshold": {},
                                            "f:timeoutSeconds": {}
                                        },
                                        "f:name": {},
                                        "f:ports": {
                                            ".": {},
                                            "k:{\"containerPort\":8079,\"protocol\":\"TCP\"}": {
                                                ".": {},
                                                "f:containerPort": {},
                                                "f:protocol": {}
                                            }
                                        },
                                        "f:readinessProbe": {
                                            ".": {},
                                            "f:failureThreshold": {},
                                            "f:httpGet": {
                                                ".": {},
                                                "f:path": {},
                                                "f:port": {},
                                                "f:scheme": {}
                                            },
                                            "f:initialDelaySeconds": {},
                                            "f:periodSeconds": {},
                                            "f:successThreshold": {},
                                            "f:timeoutSeconds": {}
                                        },
                                        "f:resources": {
                                            ".": {},
                                            "f:limits": {
                                                ".": {},
                                                "f:cpu": {},
                                                "f:memory": {}
                                            },
                                            "f:requests": {
                                                ".": {},
                                                "f:cpu": {},
                                                "f:memory": {}
                                            }
                                        },
                                        "f:securityContext": {
                                            ".": {},
                                            "f:capabilities": {
                                                ".": {},
                                                "f:drop": {}
                                            },
                                            "f:readOnlyRootFilesystem": {},
                                            "f:runAsNonRoot": {},
                                            "f:runAsUser": {}
                                        },
                                        "f:terminationMessagePath": {},
                                        "f:terminationMessagePolicy": {}
                                    }
                                },
                                "f:dnsPolicy": {},
                                "f:enableServiceLinks": {},
                                "f:nodeSelector": {},
                                "f:restartPolicy": {},
                                "f:schedulerName": {},
                                "f:securityContext": {},
                                "f:terminationGracePeriodSeconds": {}
                            }
                        },
                        "manager": "kube-controller-manager",
                        "operation": "Update",
                        "time": "2023-05-07T21:29:32Z"
                    },
                    {
                        "apiVersion": "v1",
                        "fieldsType": "FieldsV1",
                        "fieldsV1": {
                            "f:status": {
                                "f:conditions": {
                                    "k:{\"type\":\"ContainersReady\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    },
                                    "k:{\"type\":\"Initialized\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    },
                                    "k:{\"type\":\"Ready\"}": {
                                        ".": {},
                                        "f:lastProbeTime": {},
                                        "f:lastTransitionTime": {},
                                        "f:status": {},
                                        "f:type": {}
                                    }
                                },
                                "f:containerStatuses": {},
                                "f:hostIP": {},
                                "f:phase": {},
                                "f:podIP": {},
                                "f:podIPs": {
                                    ".": {},
                                    "k:{\"ip\":\"10.244.0.148\"}": {
                                        ".": {},
                                        "f:ip": {}
                                    }
                                },
                                "f:startTime": {}
                            }
                        },
                        "manager": "kubelet",
                        "operation": "Update",
                        "subresource": "status",
                        "time": "2023-05-07T21:30:17Z"
                    }
                ],
                "name": "front-end-7d89d49d6b-n96mr",
                "namespace": "sock-shop",
                "ownerReferences": [
                    {
                        "apiVersion": "apps/v1",
                        "blockOwnerDeletion": true,
                        "controller": true,
                        "kind": "ReplicaSet",
                        "name": "front-end-7d89d49d6b",
                        "uid": "6bda5922-fdce-4d40-8bc5-25d6a9cc3911"
                    }
                ],
                "resourceVersion": "137830",
                "uid": "ef550604-fea9-4a47-b8ab-53ef1904698b"
            },
            "spec": {
                "containers": [
                    {
                        "env": [
                            {
                                "name": "SESSION_REDIS",
                                "value": "true"
                            }
                        ],
                        "image": "weaveworksdemos/front-end:0.3.12",
                        "imagePullPolicy": "IfNotPresent",
                        "livenessProbe": {
                            "failureThreshold": 3,
                            "httpGet": {
                                "path": "/",
                                "port": 8079,
                                "scheme": "HTTP"
                            },
                            "initialDelaySeconds": 300,
                            "periodSeconds": 3,
                            "successThreshold": 1,
                            "timeoutSeconds": 1
                        },
                        "name": "front-end",
                        "ports": [
                            {
                                "containerPort": 8079,
                                "protocol": "TCP"
                            }
                        ],
                        "readinessProbe": {
                            "failureThreshold": 3,
                            "httpGet": {
                                "path": "/",
                                "port": 8079,
                                "scheme": "HTTP"
                            },
                            "initialDelaySeconds": 30,
                            "periodSeconds": 3,
                            "successThreshold": 1,
                            "timeoutSeconds": 1
                        },
                        "resources": {
                            "limits": {
                                "cpu": "300m",
                                "memory": "1000Mi"
                            },
                            "requests": {
                                "cpu": "100m",
                                "memory": "300Mi"
                            }
                        },
                        "securityContext": {
                            "capabilities": {
                                "drop": [
                                    "all"
                                ]
                            },
                            "readOnlyRootFilesystem": true,
                            "runAsNonRoot": true,
                            "runAsUser": 10001
                        },
                        "terminationMessagePath": "/dev/termination-log",
                        "terminationMessagePolicy": "File",
                        "volumeMounts": [
                            {
                                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                                "name": "kube-api-access-9k72z",
                                "readOnly": true
                            }
                        ]
                    }
                ],
                "dnsPolicy": "ClusterFirst",
                "enableServiceLinks": true,
                "nodeName": "mizu",
                "nodeSelector": {
                    "beta.kubernetes.io/os": "linux"
                },
                "preemptionPolicy": "PreemptLowerPriority",
                "priority": 0,
                "restartPolicy": "Always",
                "schedulerName": "default-scheduler",
                "securityContext": {},
                "serviceAccount": "default",
                "serviceAccountName": "default",
                "terminationGracePeriodSeconds": 30,
                "tolerations": [
                    {
                        "effect": "NoExecute",
                        "key": "node.kubernetes.io/not-ready",
                        "operator": "Exists",
                        "tolerationSeconds": 300
                    },
                    {
                        "effect": "NoExecute",
                        "key": "node.kubernetes.io/unreachable",
                        "operator": "Exists",
                        "tolerationSeconds": 300
                    }
                ],
                "volumes": [
                    {
                        "name": "kube-api-access-9k72z",
                        "projected": {
                            "defaultMode": 420,
                            "sources": [
                                {
                                    "serviceAccountToken": {
                                        "expirationSeconds": 3607,
                                        "path": "token"
                                    }
                                },
                                {
                                    "configMap": {
                                        "items": [
                                            {
                                                "key": "ca.crt",
                                                "path": "ca.crt"
                                            }
                                        ],
                                        "name": "kube-root-ca.crt"
                                    }
                                },
                                {
                                    "downwardAPI": {
                                        "items": [
                                            {
                                                "fieldRef": {
                                                    "apiVersion": "v1",
                                                    "fieldPath": "metadata.namespace"
                                                },
                                                "path": "namespace"
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "status": {
                "conditions": [
                    {
                        "lastTransitionTime": "2023-05-07T21:29:32Z",
                        "status": "True",
                        "type": "Initialized"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:30:17Z",
                        "status": "True",
                        "type": "Ready"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:30:17Z",
                        "status": "True",
                        "type": "ContainersReady"
                    },
                    {
                        "lastTransitionTime": "2023-05-07T21:29:32Z",
                        "status": "True",
                        "type": "PodScheduled"
                    }
                ],
                "containerStatuses": [
                    {
                        "containerID": "docker://55d10e65ae5b6ddd853f68f8c2898105d92a19382368f3eab7fc2c15f9e8c786",
                        "image": "weaveworksdemos/front-end:0.3.12",
                        "imageID": "docker-pullable://weaveworksdemos/front-end@sha256:26a2d9b6b291dee2dca32fca3f5bff6c2fa07bb5954359afcbc8001cc70eac71",
                        "lastState": {},
                        "name": "front-end",
                        "ready": true,
                        "restartCount": 0,
                        "started": true,
                        "state": {
                            "running": {
                                "startedAt": "2023-05-07T21:29:45Z"
                            }
                        }
                    }
                ],
                "hostIP": "192.168.64.4",
                "phase": "Running",
                "podIP": "10.244.0.148",
                "podIPs": [
                    {
                        "ip": "10.244.0.148"
                    }
                ],
                "qosClass": "Burstable",
                "startTime": "2023-05-07T21:29:32Z"
            }
        },
        "port": "49090"
    },
    "startTime": "2023-05-07T21:36:40.610593Z",
    "stream": "000000001497.pcap",
    "timestamp": 1683495400610,
    "tls": false,
    "worker": "192.168.64.4:8897"
}
```


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
    "data": {
        "dst": {
            "ip": "10.0.0.61",
            "name": "",
            "namespace": "",
            "port": "8086"
        },
        "elapsedTime": 22,
        "failed": false,
        "id": "192.168.64.4:8897/000000000977.pcap-0",
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
            "bodySize": 220,
            "cookies": {},
            "headers": {
                "Accept-Encoding": "gzip",
                "Authorization": "Token DUv0ItR7LCtn42pCwMO96v6gWIL17RQKkXr-Gb5itbVUuqqPmapXacubsUX8HxSTUdlP3X2EW_yThQfdgCCy0Q==",
                "Content-Length": "220",
                "Host": "10.0.0.61:8086",
                "User-Agent": "influxdb-client-go/2.12.2 (linux; amd64)"
            },
            "headersSize": -1,
            "httpVersion": "HTTP/1.1",
            "method": "POST",
            "path": "/api/v2/write",
            "pathSegments": [
                "api",
                "v2",
                "write"
            ],
            "postData": {
                "mimeType": "",
                "params": [],
                "text": "callKPIs,dst_ip=10.0.0.61,dst_name=unresolved,dst_ns=unresolved,dst_port=8086,node=mizu,path=/api/v2/write,src_ip=192.168.64.4,src_name=kubernetes,src_ns=kubeshark bandwidth=584,latency=22,status=204 1683407112628832003\n"
            },
            "queryString": {
                "bucket": "Intel",
                "org": "Kubeshark",
                "precision": "ns"
            },
            "targetUri": "/api/v2/write?bucket=Intel\u0026org=Kubeshark\u0026precision=ns",
            "url": "/api/v2/write?bucket=Intel\u0026org=Kubeshark\u0026precision=ns"
        },
        "requestSize": 522,
        "response": {
            "bodySize": 0,
            "content": {
                "encoding": "base64",
                "mimeType": "",
                "size": 0
            },
            "cookies": {},
            "headers": {
                "Date": "Sat, 06 May 2023 21:05:12 GMT",
                "X-Influxdb-Build": "OSS",
                "X-Influxdb-Version": "2.6.1"
            },
            "headersSize": -1,
            "httpVersion": "HTTP/1.1",
            "redirectURL": "",
            "status": 204,
            "statusText": "No Content"
        },
        "responseSize": 114,
        "src": {
            "endpointSlice": {
                "metadata": {
                    "creationTimestamp": "2023-05-06T16:53:07Z",
                    "labels": {
                        "endpointslice.kubernetes.io/skip-mirror": "true"
                    },
                    "managedFields": [
                        {
                            "apiVersion": "v1",
                            "fieldsType": "FieldsV1",
                            "fieldsV1": {
                                "f:metadata": {
                                    "f:labels": {
                                        ".": {},
                                        "f:endpointslice.kubernetes.io/skip-mirror": {}
                                    }
                                },
                                "f:subsets": {}
                            },
                            "manager": "kube-apiserver",
                            "operation": "Update",
                            "time": "2023-05-06T16:53:07Z"
                        }
                    ],
                    "name": "kubernetes",
                    "namespace": "default",
                    "resourceVersion": "199",
                    "uid": "058c0d40-50d9-4f60-93cc-bd5c49b3f57c"
                },
                "subsets": [
                    {
                        "addresses": [
                            {
                                "ip": "192.168.64.4"
                            }
                        ],
                        "ports": [
                            {
                                "name": "https",
                                "port": 8443,
                                "protocol": "TCP"
                            }
                        ]
                    }
                ]
            },
            "ip": "192.168.64.4",
            "name": "kubernetes",
            "namespace": "kubeshark",
            "pod": {
                "metadata": {
                    "creationTimestamp": "2023-05-06T16:54:36Z",
                    "generateName": "kubeshark-worker-daemon-set-",
                    "labels": {
                        "app": "kubeshark-worker",
                        "controller-revision-hash": "5644f7b6b",
                        "kubeshark-created-by": "kubeshark",
                        "kubeshark-managed-by": "kubeshark",
                        "pod-template-generation": "1"
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
                                        "f:app": {},
                                        "f:controller-revision-hash": {},
                                        "f:kubeshark-created-by": {},
                                        "f:kubeshark-managed-by": {},
                                        "f:pod-template-generation": {}
                                    },
                                    "f:ownerReferences": {
                                        ".": {},
                                        "k:{\"uid\":\"c80c3abf-3c97-4e63-84c9-ba5c3c430cd1\"}": {}
                                    }
                                },
                                "f:spec": {
                                    "f:affinity": {
                                        ".": {},
                                        "f:nodeAffinity": {
                                            ".": {},
                                            "f:requiredDuringSchedulingIgnoredDuringExecution": {}
                                        }
                                    },
                                    "f:containers": {
                                        "k:{\"name\":\"kubeshark-worker\"}": {
                                            ".": {},
                                            "f:command": {},
                                            "f:image": {},
                                            "f:imagePullPolicy": {},
                                            "f:name": {},
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
                                                }
                                            },
                                            "f:terminationMessagePath": {},
                                            "f:terminationMessagePolicy": {},
                                            "f:volumeMounts": {
                                                ".": {},
                                                "k:{\"mountPath\":\"/app/data\"}": {
                                                    ".": {},
                                                    "f:mountPath": {},
                                                    "f:name": {}
                                                },
                                                "k:{\"mountPath\":\"/hostproc\"}": {
                                                    ".": {},
                                                    "f:mountPath": {},
                                                    "f:name": {},
                                                    "f:readOnly": {}
                                                },
                                                "k:{\"mountPath\":\"/sys\"}": {
                                                    ".": {},
                                                    "f:mountPath": {},
                                                    "f:name": {},
                                                    "f:readOnly": {}
                                                }
                                            }
                                        }
                                    },
                                    "f:dnsPolicy": {},
                                    "f:enableServiceLinks": {},
                                    "f:hostNetwork": {},
                                    "f:restartPolicy": {},
                                    "f:schedulerName": {},
                                    "f:securityContext": {},
                                    "f:serviceAccount": {},
                                    "f:serviceAccountName": {},
                                    "f:terminationGracePeriodSeconds": {},
                                    "f:tolerations": {},
                                    "f:volumes": {
                                        ".": {},
                                        "k:{\"name\":\"kubeshark-persistent-volume\"}": {
                                            ".": {},
                                            "f:name": {},
                                            "f:persistentVolumeClaim": {
                                                ".": {},
                                                "f:claimName": {}
                                            }
                                        },
                                        "k:{\"name\":\"proc\"}": {
                                            ".": {},
                                            "f:hostPath": {
                                                ".": {},
                                                "f:path": {},
                                                "f:type": {}
                                            },
                                            "f:name": {}
                                        },
                                        "k:{\"name\":\"sys\"}": {
                                            ".": {},
                                            "f:hostPath": {
                                                ".": {},
                                                "f:path": {},
                                                "f:type": {}
                                            },
                                            "f:name": {}
                                        }
                                    }
                                }
                            },
                            "manager": "kube-controller-manager",
                            "operation": "Update",
                            "time": "2023-05-06T16:54:36Z"
                        },
                        {
                            "apiVersion": "v1",
                            "fieldsType": "FieldsV1",
                            "fieldsV1": {
                                "f:status": {
                                    "f:conditions": {
                                        ".": {},
                                        "k:{\"type\":\"PodScheduled\"}": {
                                            ".": {},
                                            "f:lastProbeTime": {},
                                            "f:lastTransitionTime": {},
                                            "f:message": {},
                                            "f:reason": {},
                                            "f:status": {},
                                            "f:type": {}
                                        }
                                    }
                                }
                            },
                            "manager": "kube-scheduler",
                            "operation": "Update",
                            "subresource": "status",
                            "time": "2023-05-06T16:54:36Z"
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
                                        "k:{\"ip\":\"192.168.64.4\"}": {
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
                            "time": "2023-05-06T21:03:59Z"
                        }
                    ],
                    "name": "kubeshark-worker-daemon-set-hvn25",
                    "namespace": "kubeshark",
                    "ownerReferences": [
                        {
                            "apiVersion": "apps/v1",
                            "blockOwnerDeletion": true,
                            "controller": true,
                            "kind": "DaemonSet",
                            "name": "kubeshark-worker-daemon-set",
                            "uid": "c80c3abf-3c97-4e63-84c9-ba5c3c430cd1"
                        }
                    ],
                    "resourceVersion": "20199",
                    "uid": "465142ab-e5aa-4203-a2c4-8a53763b3db8"
                },
                "spec": {
                    "affinity": {
                        "nodeAffinity": {
                            "requiredDuringSchedulingIgnoredDuringExecution": {
                                "nodeSelectorTerms": [
                                    {
                                        "matchFields": [
                                            {
                                                "key": "metadata.name",
                                                "operator": "In",
                                                "values": [
                                                    "mizu"
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    "containers": [
                        {
                            "command": [
                                "./worker",
                                "-i",
                                "any",
                                "-port",
                                "8897",
                                "-packet-capture",
                                "libpcap",
                                "-servicemesh",
                                "-tls",
                                "-procfs",
                                "/hostproc"
                            ],
                            "image": "docker.io/kubeshark/worker:latest",
                            "imagePullPolicy": "Always",
                            "name": "kubeshark-worker",
                            "resources": {
                                "limits": {
                                    "cpu": "750m",
                                    "memory": "1Gi"
                                },
                                "requests": {
                                    "cpu": "50m",
                                    "memory": "50Mi"
                                }
                            },
                            "securityContext": {
                                "capabilities": {
                                    "add": [
                                        "NET_RAW",
                                        "NET_ADMIN",
                                        "SYS_ADMIN",
                                        "SYS_PTRACE",
                                        "DAC_OVERRIDE",
                                        "SYS_RESOURCE"
                                    ],
                                    "drop": [
                                        "ALL"
                                    ]
                                }
                            },
                            "terminationMessagePath": "/dev/termination-log",
                            "terminationMessagePolicy": "File",
                            "volumeMounts": [
                                {
                                    "mountPath": "/hostproc",
                                    "name": "proc",
                                    "readOnly": true
                                },
                                {
                                    "mountPath": "/sys",
                                    "name": "sys",
                                    "readOnly": true
                                },
                                {
                                    "mountPath": "/app/data",
                                    "name": "kubeshark-persistent-volume"
                                },
                                {
                                    "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                                    "name": "kube-api-access-5fkfq",
                                    "readOnly": true
                                }
                            ]
                        }
                    ],
                    "dnsPolicy": "ClusterFirstWithHostNet",
                    "enableServiceLinks": true,
                    "hostNetwork": true,
                    "nodeName": "mizu",
                    "preemptionPolicy": "PreemptLowerPriority",
                    "priority": 0,
                    "restartPolicy": "Always",
                    "schedulerName": "default-scheduler",
                    "securityContext": {},
                    "serviceAccount": "kubeshark-service-account",
                    "serviceAccountName": "kubeshark-service-account",
                    "terminationGracePeriodSeconds": 0,
                    "tolerations": [
                        {
                            "effect": "NoExecute",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoExecute",
                            "key": "node.kubernetes.io/not-ready",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoExecute",
                            "key": "node.kubernetes.io/unreachable",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "key": "node.kubernetes.io/disk-pressure",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "key": "node.kubernetes.io/memory-pressure",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "key": "node.kubernetes.io/pid-pressure",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "key": "node.kubernetes.io/unschedulable",
                            "operator": "Exists"
                        },
                        {
                            "effect": "NoSchedule",
                            "key": "node.kubernetes.io/network-unavailable",
                            "operator": "Exists"
                        }
                    ],
                    "volumes": [
                        {
                            "hostPath": {
                                "path": "/proc",
                                "type": ""
                            },
                            "name": "proc"
                        },
                        {
                            "hostPath": {
                                "path": "/sys",
                                "type": ""
                            },
                            "name": "sys"
                        },
                        {
                            "name": "kubeshark-persistent-volume",
                            "persistentVolumeClaim": {
                                "claimName": "kubeshark-persistent-volume-claim"
                            }
                        },
                        {
                            "name": "kube-api-access-5fkfq",
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
                            "lastTransitionTime": "2023-05-06T16:54:37Z",
                            "status": "True",
                            "type": "Initialized"
                        },
                        {
                            "lastTransitionTime": "2023-05-06T21:03:59Z",
                            "status": "True",
                            "type": "Ready"
                        },
                        {
                            "lastTransitionTime": "2023-05-06T21:03:59Z",
                            "status": "True",
                            "type": "ContainersReady"
                        },
                        {
                            "lastTransitionTime": "2023-05-06T16:54:37Z",
                            "status": "True",
                            "type": "PodScheduled"
                        }
                    ],
                    "containerStatuses": [
                        {
                            "containerID": "docker://a679663ef486d6dc6f24e8157685eb561d26707193924555af537a158a34ec03",
                            "image": "kubeshark/worker:latest",
                            "imageID": "docker-pullable://kubeshark/worker@sha256:1a9b92dee7911f90384fb920d8663c59eb494031176d218a4d9f634298a25c06",
                            "lastState": {
                                "terminated": {
                                    "containerID": "docker://9821ba51c94d650a7950daf2c32eb3d6582f84a3423ec555ad4b2e9161c4750b",
                                    "exitCode": 137,
                                    "finishedAt": "2023-05-06T21:03:57Z",
                                    "reason": "OOMKilled",
                                    "startedAt": "2023-05-06T16:54:42Z"
                                }
                            },
                            "name": "kubeshark-worker",
                            "ready": true,
                            "restartCount": 1,
                            "started": true,
                            "state": {
                                "running": {
                                    "startedAt": "2023-05-06T21:03:58Z"
                                }
                            }
                        }
                    ],
                    "hostIP": "192.168.64.4",
                    "phase": "Running",
                    "podIP": "192.168.64.4",
                    "podIPs": [
                        {
                            "ip": "192.168.64.4"
                        }
                    ],
                    "qosClass": "Burstable",
                    "startTime": "2023-05-06T16:54:37Z"
                }
            },
            "port": "40754"
        },
        "startTime": "2023-05-06T21:05:12.643129355Z",
        "stream": "000000000977.pcap",
        "timestamp": 1683407112643,
        "tls": false,
        "worker": "192.168.64.4:8897"
    },
```

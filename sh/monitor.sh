node data/monitoring/metno.js 2>&1 | logger -t 'hyf.metno'
node data/monitoring/monitoring.js 2>&1 | logger -t 'hyf.monitoring'

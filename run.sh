
pids=""
node data/australia/australia.js > /tmp/todo/australia.$(date +%s).json 2>> /tmp/log.australia.txt &
pids="$pids $!"
node data/uk/metOfficeUK.js  > /tmp/todo/metOfficeUK.$(date +%s).json 2>> /tmp/log.metOfficeUK.txt &
pids="$pids $!"
node data/usa/usa.js > /tmp/todo/usa.$(date +%s).json 2>> /tmp/log.usa.txt &
pids="$pids $!"
node data/europe/rmi_europe.js > /tmp/todo/rmi_europe.$(date +%s).json 2>> /tmp/log.rmi_europe.txt &
pids="$pids $!"
node data/belgium/rmi_belgium.js > /tmp/todo/rmi_belgium.$(date +%s).json  2>> /tmp/log.rmi_belgium.txt &
pids="$pids $!"
node data/world/rmi_world.js > /tmp/todo/rmi_world.$(date +%s).json  2>> /tmp/log.rmi_world.txt &
pids="$pids $!"
node data/iceland/iceland.js > /tmp/todo/iceland.$(date +%s).json 2>> /tmp/log.iceland.txt &
pids="$pids $!"
node data/slovenia/slovenia.js > /tmp/todo/slovenia.$(date +%s).json 2>>/tmp/log.slovenia.txt &
pids="$pids $!"
node data/poland/poland.js > /tmp/todo/poland.$(date +%s).json 2>>/tmp/log.poland.txt &
pids="$pids $!"
node data/smhi/smhi.js > /tmp/todo/smhi.$(date +%s).json 2>>/tmp/log.smhi.txt &
pids="$pids $!"
node data/netherlands/netherlands.js > /tmp/todo/netherlands.$(date +%s).json 2>>/tmp/log.netherlands.txt &
pids="$pids $!"

echo waiting for $pids
wait $pids

node data/consumer/consumer.js >> /tmp/log.consumer.txt 2>&1


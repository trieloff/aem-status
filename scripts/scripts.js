async function getHistory() {
    /*
    const incidentHistory = [];
    let i = 1;
    let status = 200;
    do {
        // eslint-disable-next-line no-await-in-loop 
        const response = await fetch(`/incidents/json/history-${i}.json`);
        status = response.status;
        if (status === 200) {
            const data = await response.json();
            incidentHistory.push(...data.months);
        }
        i++;
    } while (status === 200);
     */
    const response = await fetch('/incidents/index.json');
    const incidentHistory = await response.json();
    return incidentHistory;
}

const displayIncidentHistory = (history) => {
    const incidentHistory = document.getElementById('incidentHistory');
    incidentHistory.innerHTML = '';
    incidentHistory.classList.add('incidents');
    history.forEach(month => {
        const monthElement = document.createElement('div');
        monthElement.innerHTML = `<h3>${month.name} ${month.year}</h3>`;
        incidentHistory.appendChild(monthElement);
        if (month.incidents.length === 0) {
            const metaElement = document.createElement('p');
            metaElement.classList.add('meta'); 
            metaElement.textContent = '(No incidents reported)';
            monthElement.appendChild(metaElement);
        }
        month.incidents.forEach(incident => {
            const incidentElement = document.createElement('div');
            incidentElement.classList.add('incident', incident.impact);
            incidentElement.innerHTML = `<h4><a href="/details.html?incident=${incident.code}">${incident.name}</a><span class="pill ${incident.impact}">${incident.impact}</span></h4>
            <p>${incident.message}</p>
            <time class="meta" datetime="${incident.timestamp}">${incident.timestamp}</time>`;
            monthElement.appendChild(incidentElement);
        });
    });
}

const initIncidentHistory = async () => {
    const history = await getHistory();
    displayIncidentHistory(history);
}

initIncidentHistory();

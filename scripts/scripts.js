async function getHistory() {
    const incidentHistory = [];
    let i = 1;
    let status = 200;
    do {
        /* eslint-disable no-await-in-loop */
        const response = await fetch(`/incidents/json/history-${i}.json`);
        status = response.status;
        if (status === 200) {
            const data = await response.json();
            incidentHistory.push(...data.months);
        }
        i++;
    } while (status === 200);
    return incidentHistory;
}

const displayIncidentHistory = (history) => {
    const incidentHistory = document.getElementById('incidentHistory');
    incidentHistory.innerHTML = '';
    incidentHistory.classList.add('incidents');
    
    if (history.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">✓</div>
            <h3>No incidents reported</h3>
            <p>All systems have been operating normally for the past 90 days.</p>
        `;
        incidentHistory.appendChild(emptyState);
        return;
    }
    
    history.forEach(month => {
        const monthElement = document.createElement('div');
        monthElement.className = 'month-section';
        monthElement.innerHTML = `<h3 class="month-title">${month.name} ${month.year}</h3>`;
        incidentHistory.appendChild(monthElement);
        
        if (month.incidents.length === 0) {
            const metaElement = document.createElement('p');
            metaElement.classList.add('meta', 'no-incidents'); 
            metaElement.textContent = 'No incidents reported this month';
            monthElement.appendChild(metaElement);
        } else {
            month.incidents.forEach(incident => {
                const incidentElement = document.createElement('div');
                incidentElement.classList.add('incident', incident.impact);
                incidentElement.innerHTML = `
                    <div class="incident-header">
                        <h4><a href="/details.html?incident=${incident.code}">${incident.name}</a></h4>
                        <span class="pill ${incident.impact}">${incident.impact}</span>
                    </div>
                    <p class="incident-description">${incident.message}</p>
                    <time class="meta" datetime="${incident.timestamp}">${incident.timestamp}</time>
                `;
                monthElement.appendChild(incidentElement);
            });
        }
    });
}

const initIncidentHistory = async () => {
    try {
        const history = await getHistory();
        displayIncidentHistory(history);
    } catch (error) {
        const incidentHistory = document.getElementById('incidentHistory');
        incidentHistory.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠</div>
                <h3>Unable to load incident history</h3>
                <p>There was an error loading the incident history. Please try again later.</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

initIncidentHistory();

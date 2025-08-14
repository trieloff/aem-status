const fetchCurrentIncident = async () => {
  const response = await fetch('https://script.google.com/macros/s/AKfycbxoBSj7v-y5WyoeSn1T0KcFsoQXEYQiiK_nmOPf-pKAJqf7w46ubpt0XmwFM7qdbzgCzw/exec', {
    cache: 'reload',
  });
  const json = await response.json();
  const { rows } = json;

  if (!rows.length) return [];

  const data = rows.map((row) => {
    const status = row.Status.toLowerCase();
    const impact = row.Impact.toLowerCase();
    const timestamp = row.Timestamp;
    const comment = row.Comment.replace(/\n/g, '<br>').replace(/https:\/\/\S+/g, '<a href="$&">$&</a>');

    return {
      status,
      impact,
      timestamp,
      comment,
    };
  });

  console.log(data);

  return data;
};

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

const timeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const isPast = diffMs >= 0;
  const ms = Math.abs(diffMs);

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${prefix}${seconds} second${seconds === 1 ? '' : 's'}${suffix}`;
  if (minutes < 2) return isPast ? 'a minute ago' : 'in a minute';
  if (minutes < 60) return `${prefix}${minutes} minute${minutes === 1 ? '' : 's'}${suffix}`;
  if (hours < 2) return isPast ? 'an hour ago' : 'in an hour';
  if (hours < 24) return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${suffix}`;
  if (days === 1) return isPast ? 'yesterday' : 'tomorrow';
  if (days < 7) return `${prefix}${days} day${days === 1 ? '' : 's'}${suffix}`;
  if (weeks < 2) return isPast ? 'a week ago' : 'in a week';
  if (weeks < 5) return `${prefix}${weeks} week${weeks === 1 ? '' : 's'}${suffix}`;
  if (months < 2) return isPast ? 'a month ago' : 'in a month';
  if (months < 12) return `${prefix}${months} month${months === 1 ? '' : 's'}${suffix}`;
  if (years < 2) return isPast ? 'a year ago' : 'in a year';
  return `${prefix}${years} year${years === 1 ? '' : 's'}${suffix}`;
};

const displayIncidentHistory = (history) => {
  const incidentHistory = document.getElementById('incidentHistory');
  incidentHistory.innerHTML = '';
  incidentHistory.classList.add('incidents');
  history.forEach((month) => {
    const monthElement = document.createElement('div');
    monthElement.innerHTML = `<h3>${month.name} ${month.year}</h3>`;
    incidentHistory.appendChild(monthElement);
    if (month.incidents.length === 0) {
      const metaElement = document.createElement('p');
      metaElement.classList.add('meta');
      metaElement.textContent = '(No incidents reported)';
      monthElement.appendChild(metaElement);
    }
    month.incidents.forEach((incident) => {
      const incidentElement = document.createElement('div');
      incidentElement.classList.add('incident', incident.impact);
      incidentElement.innerHTML = `<h4><a href="/details.html?incident=${incident.code}">${incident.name}</a><span class="pill ${incident.impact}">${incident.impact}</span></h4>
          <p>${incident.message}</p>
          <time class="meta" datetime="${incident.timestamp}">${incident.timestamp}</time>`;
      monthElement.appendChild(incidentElement);
    });
  });
};

const displayCurrentIncident = (currentIncident) => {
  const updateCurrentImpact = (status, impact, affectedServices) => {
    const impactClasses = {
      minor: 'warn',
      major: 'err',
      none: 'ok',
    };
    document.querySelector('#current-incident').className = `section ${impactClasses[impact]}`;
    if (status === 'resolved' || status === 'monitoring') {
      document.querySelector('header').className = 'ok';
      document.querySelector('.status-overview .status-badge').className = 'status-badge ok';
      document.querySelectorAll('.service').forEach((service) => {
        service.dataset.impacted = '';
        service.querySelector('.state').className = 'state ok';
      });
    } else {
      document.querySelector('header').className = impactClasses[impact] ?? 'ok';
      document.querySelector('.status-overview .status-badge').className = `status-badge ${impactClasses[impact] ?? 'ok'}`;
      document.querySelectorAll('.service').forEach((service) => {
        if (affectedServices.includes(service.classList[1])) {
          service.dataset.impacted = impactClasses[impact] ?? '';
          service.querySelector('.state').className = `state ${impactClasses[impact]}`;
        } else {
          service.dataset.impacted = '';
          service.querySelector('.state').className = 'state ok';
        }
      });
    }
  };

  const parseAffectedServices = (incident) => {
    const affectedServices = [];
    if (incident[incident.length - 1].comment.toLowerCase().includes('publishing')) affectedServices.push('publishing');
    if (incident[incident.length - 1].comment.toLowerCase().includes('delivery')) affectedServices.push('delivery');
    return affectedServices;
  };

  const currentIncidentSection = document.getElementById('current-incident');

  if (currentIncident.length > 0) {
    currentIncidentSection.setAttribute('aria-hidden', 'false');

    currentIncident.reverse();
    const { impact } = currentIncident[0];
    const { status } = currentIncident[0];
    const affectedServices = parseAffectedServices(currentIncident);
    updateCurrentImpact(status, impact, affectedServices);

    const currentIncidentElement = document.getElementById('current-incident-details');
    currentIncidentElement.innerHTML = '';
    currentIncident.forEach((statusUpdate) => {
      const statusUpdateElement = document.createElement('div');
      statusUpdateElement.classList.add('status-update');
      statusUpdateElement.innerHTML = `<time datetime="${statusUpdate.timestamp}">${timeAgo(new Date(statusUpdate.timestamp))}</time> (${new Date(statusUpdate.timestamp).toLocaleString()}) <span class="pill ${statusUpdate.status}">${statusUpdate.status}</span>
          <p>${statusUpdate.comment}</p>`;
      if (statusUpdate.status) statusUpdateElement.classList.add(statusUpdate.status);
      statusUpdateElement.setAttribute('aria-label', statusUpdate.status);
      currentIncidentElement.appendChild(statusUpdateElement);
    });
  } else {
    currentIncidentSection.setAttribute('aria-hidden', 'true');
  }
};

const updateCurrentIncident = async () => {
  const currentIncident = await fetchCurrentIncident();
  if (currentIncident.length) {
    displayCurrentIncident(currentIncident);
  }
};

const initIncidents = async () => {
  updateCurrentIncident();
  setInterval(updateCurrentIncident, 30000);
  const history = await getHistory();
  displayIncidentHistory(history);
};

initIncidents();

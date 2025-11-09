let editingPlayer = null;
let currentLeaderboardType = document.body.getAttribute('data-lb-type') || 'classic';

function getLeaderboardType() {
    return window.location.pathname === '/' ? 'classic' : 
           window.location.pathname === '/ffa' ? 'ffa' : 
           window.location.pathname === '/classic' ? 'classic' : 'classic';
}

currentLeaderboardType = getLeaderboardType();

function updateFormFields() {
    const lb = currentLeaderboardType;
    document.getElementById('classicFields').style.display = lb === 'classic' ? 'block' : 'none';
    document.getElementById('ffaFields').style.display = lb === 'ffa' ? 'block' : 'none';
    
    document.getElementById('classicHeader').style.display = lb === 'classic' ? 'table-row' : 'none';
    document.getElementById('ffaHeader').style.display = lb === 'ffa' ? 'table-row' : 'none';
}

function openModal() {
    editingPlayer = null;
    document.getElementById('playerForm').reset();
    document.getElementById('modalTitle').textContent = 'Add New Player';
    updateFormFields();
    document.getElementById('modal').style.display = 'block';
}

function openEditModal(player) {
    editingPlayer = player;
    document.getElementById('playerName').value = player.name;
    document.getElementById('robloxLink').value = player.roblox_link || '';
    
    const lb = currentLeaderboardType;
    
    if (lb === 'classic') {
        document.getElementById('rankRatingClassic').value = player.rank;
    } else if (lb === 'ffa') {
        document.getElementById('starRatingFFA').value = player.stars;
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Player';
    updateFormFields();
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const exportModal = document.getElementById('exportModal');
    const importModal = document.getElementById('importModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == exportModal) {
        exportModal.style.display = 'none';
    }
    if (event.target == importModal) {
        importModal.style.display = 'none';
    }
}

function addPlayer(event) {
    event.preventDefault();
    
    const name = document.getElementById('playerName').value;
    const robloxLink = document.getElementById('robloxLink').value;
    const lb = currentLeaderboardType;
    
    let payload = {
        name: name,
        roblox_link: robloxLink
    };
    
    if (lb === 'classic') {
        const rank = document.getElementById('rankRatingClassic').value;
        if (!rank) {
            alert('Please select a rank');
            return;
        }
        payload.rank = rank;
    } else if (lb === 'ffa') {
        const stars = document.getElementById('starRatingFFA').value;
        if (!stars) {
            alert('Please select stars');
            return;
        }
        payload.stars = parseFloat(stars);
    }
    
    if (editingPlayer) {
        fetch(`/api/players/${lb}/${encodeURIComponent(editingPlayer.name)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_name: name,
                ...payload
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('playerForm').reset();
                closeModal();
                loadPlayers();
                editingPlayer = null;
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    } else {
        fetch(`/api/players/${lb}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('playerForm').reset();
                closeModal();
                loadPlayers();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

function deletePlayer(name) {
    if (confirm('Are you sure you want to delete ' + name + '?')) {
        fetch(`/api/players/${currentLeaderboardType}/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            loadPlayers();
        })
        .catch(error => console.error('Error:', error));
    }
}

function deleteAll() {
    if (confirm('Are you sure you want to delete ALL players? This cannot be undone.')) {
        fetch(`/api/players/${currentLeaderboardType}/delete-all`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            loadPlayers();
        })
        .catch(error => console.error('Error:', error));
    }
}

let draggedRowIndex = null;
let editingRowName = null;

function toggleEditDropdown(playerName) {
    const lb = currentLeaderboardType;
    const tbody = document.getElementById('playerRows');
    
    if (editingRowName === playerName) {
        const editRow = document.getElementById(`edit-${playerName}`);
        if (editRow) editRow.remove();
        editingRowName = null;
        return;
    }
    
    if (editingRowName) {
        const oldEditRow = document.getElementById(`edit-${editingRowName}`);
        if (oldEditRow) oldEditRow.remove();
    }
    
    const playerRow = Array.from(tbody.querySelectorAll('tr')).find(r => r.dataset.playerName === playerName);
    if (!playerRow) return;
    
    const player = playerRow.dataset.playerData ? JSON.parse(playerRow.dataset.playerData) : null;
    if (!player) return;
    
    const editRow = document.createElement('tr');
    editRow.id = `edit-${playerName}`;
    editRow.className = 'edit-dropdown-row';
    
    let editContent = `
        <td colspan="100" style="padding: 0;">
            <div class="edit-dropdown">
                <div class="edit-fields">
                    <div class="edit-field-group">
                        <label>Name:</label>
                        <input type="text" id="edit-name" value="${player.name}">
                    </div>
    `;
    
    if (lb === 'classic') {
        editContent += `
                    <div class="edit-field-group">
                        <label>Rank:</label>
                        <select id="edit-rank">
                            <option value="">Select Rank</option>
        `;
        const ranksSelect = document.getElementById('rankRatingClassic');
        Array.from(ranksSelect.options).forEach(opt => {
            if (opt.value) {
                editContent += `<option value="${opt.value}" ${opt.value === player.rank ? 'selected' : ''}>${opt.value}</option>`;
            }
        });
        editContent += `</select></div>
                    <div class="edit-field-group">
                        <label>Position:</label>
                        <input type="number" id="edit-position" min="1" value="${player.position || ''}">
                    </div>`;
    } else if (lb === 'ffa') {
        editContent += `
                    <div class="edit-field-group">
                        <label>Stars:</label>
                        <select id="edit-stars">
                            <option value="">Select Stars</option>
        `;
        const starsSelect = document.getElementById('starRatingFFA');
        Array.from(starsSelect.options).forEach(opt => {
            if (opt.value) {
                editContent += `<option value="${opt.value}" ${parseFloat(opt.value) === player.stars ? 'selected' : ''}>${opt.value}</option>`;
            }
        });
        editContent += `</select></div>
                    <div class="edit-field-group">
                        <label>Position:</label>
                        <input type="number" id="edit-position" min="1" value="${player.position || ''}">
                    </div>`;
    }
    
    editContent += `
                    <div class="edit-field-group">
                        <label>Roblox Link:</label>
                        <input type="url" id="edit-roblox-link" placeholder="https://www.roblox.com/users/..." value="${player.roblox_link || ''}">
                    </div>
                </div>
                <div class="edit-actions">
                    <button class="edit-save-btn" onclick="saveInlineEdit('${playerName.replace(/'/g, "\\'")}')">Save</button>
                    <button class="edit-cancel-btn" onclick="toggleEditDropdown('${playerName.replace(/'/g, "\\'")}')">${'Cancel'}</button>
                </div>
            </div>
        </td>
    `;
    
    editRow.innerHTML = editContent;
    playerRow.insertAdjacentElement('afterend', editRow);
    editingRowName = playerName;
}

function saveInlineEdit(playerName) {
    const lb = currentLeaderboardType;
    const newName = document.getElementById('edit-name').value;
    const robloxLink = document.getElementById('edit-roblox-link').value;
    
    if (!newName) {
        alert('Player name cannot be empty');
        return;
    }
    
    let payload = {
        new_name: newName,
        roblox_link: robloxLink
    };
    
    if (lb === 'classic') {
        const rank = document.getElementById('edit-rank').value;
        const position = document.getElementById('edit-position').value;
        if (!rank) {
            alert('Please select a rank');
            return;
        }
        payload.rank = rank;
        if (position) payload.position = parseInt(position);
    } else if (lb === 'ffa') {
        const stars = document.getElementById('edit-stars').value;
        const position = document.getElementById('edit-position').value;
        if (!stars) {
            alert('Please select stars');
            return;
        }
        payload.stars = parseFloat(stars);
        if (position) payload.position = parseInt(position);
    }
    
    fetch(`/api/players/${lb}/${encodeURIComponent(playerName)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPlayers();
            editingRowName = null;
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => console.error('Error:', error));
}

function handleDragStart(event, index) {
    draggedRowIndex = index;
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, targetIndex) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    if (draggedRowIndex !== null && draggedRowIndex !== targetIndex) {
        const lb = currentLeaderboardType;
        updatePlayerPosition(draggedRowIndex, targetIndex);
    }
    draggedRowIndex = null;
}

function updatePlayerPosition(fromIndex, toIndex) {
    const lb = currentLeaderboardType;
    const tbody = document.getElementById('playerRows');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (fromIndex < 0 || fromIndex >= rows.length || toIndex < 0 || toIndex >= rows.length) return;
    
    const player1 = rows[fromIndex].dataset.playerName;
    const player2 = rows[toIndex].dataset.playerName;
    
    fetch(`/api/players/${lb}/swap`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name1: player1,
            name2: player2
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPlayers();
        }
    })
    .catch(error => console.error('Error:', error));
}

function loadPlayers() {
    const lb = currentLeaderboardType;
    fetch(`/api/players/${lb}`)
    .then(response => response.json())
    .then(players => {
        const tbody = document.getElementById('playerRows');
        tbody.innerHTML = '';
        
        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No players yet. Add one to get started!</td></tr>';
            return;
        }
        
        players.forEach((player, index) => {
            const row = document.createElement('tr');
            row.dataset.playerName = player.name;
            row.dataset.playerData = JSON.stringify(player);
            
            row.draggable = true;
                row.addEventListener('dragstart', (e) => handleDragStart(e, index));
                row.addEventListener('dragover', handleDragOver);
                row.addEventListener('dragleave', handleDragLeave);
                row.addEventListener('drop', (e) => handleDrop(e, index));
                row.addEventListener('dragend', () => row.classList.remove('dragging'));
            
            const robloxLink = player.roblox_link ? `<a href="${player.roblox_link}" target="_blank" class="roblox-link">🎮 Profile</a>` : '<span class="no-link">—</span>';
            
            if (lb === 'classic') {
                row.innerHTML = `
                    <td>#${player.position || index + 1}</td>
                    <td style="cursor: grab;" class="drag-handle">☰ ${player.name}</td>
                    <td><span class="rank-badge">${player.rank}</span></td>
                    <td><span class="points">${player.rank_points}</span></td>
                    <td>${robloxLink}</td>
                    <td>
                        <div class="actions">
                            <button class="action-btn edit-btn" onclick="toggleEditDropdown('${player.name.replace(/'/g, "\\'")}')">✏️</button>
                            <button class="action-btn delete-btn" onclick="deletePlayer('${player.name.replace(/'/g, "\\'")}')">🗑️</button>
                        </div>
                    </td>
                `;
            } else if (lb === 'ffa') {
                row.innerHTML = `
                    <td>#${player.position || index + 1}</td>
                    <td style="cursor: grab;" class="drag-handle">☰ ${player.name}</td>
                    <td><span class="star-rating"><span class="star">⭐</span> ${player.stars}</span></td>
                    <td><span class="points">${player.star_points.toFixed(1)}</span></td>
                    <td>${robloxLink}</td>
                    <td>
                        <div class="actions">
                            <button class="action-btn edit-btn" onclick="toggleEditDropdown('${player.name.replace(/'/g, "\\'")}')">✏️</button>
                            <button class="action-btn delete-btn" onclick="deletePlayer('${player.name.replace(/'/g, "\\'")}')">🗑️</button>
                        </div>
                    </td>
                `;
            }
            
            tbody.appendChild(row);
        });
    })
    .catch(error => console.error('Error:', error));
}

function exportLeaderboard() {
    const lb = currentLeaderboardType;
    const tbody = document.getElementById('playerRows');
    const players = Array.from(tbody.querySelectorAll('tr')).map(row => JSON.parse(row.dataset.playerData));
    
    let exportMessages = [];
    
    if (lb === 'classic') {
        exportMessages = generateClassicExportMulti(players);
    } else if (lb === 'ffa') {
        exportMessages = generateFFAExportMulti(players);
    }
    
    const exportText = exportMessages.join('\n\n---\n\n');
    document.getElementById('exportText').value = exportText;
    document.getElementById('exportMessageCount').textContent = exportMessages.length > 1 ? `(${exportMessages.length} messages)` : '';
    document.getElementById('exportModal').style.display = 'block';
}

function generateClassicExport(players) {
    const tierMap = {
        'S High': { tier: 'S Tier', emoji: ':STier:', sub: 'High' },
        'S Mid': { tier: 'S Tier', emoji: ':STier:', sub: 'Mid' },
        'S Low': { tier: 'S Tier', emoji: ':STier:', sub: 'Low' },
        'A+ High': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'High' },
        'A+ Mid': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'Mid' },
        'A+ Low': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'Low' },
        'A High': { tier: 'A Tier', emoji: ':MidTier:', sub: 'High' },
        'A Mid': { tier: 'A Tier', emoji: ':MidTier:', sub: 'Mid' },
        'A Low': { tier: 'A Tier', emoji: ':MidTier:', sub: 'Low' },
        'A- High': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'High' },
        'A- Mid': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'Mid' },
        'A- Low': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'Low' },
        'B+ High': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'High' },
        'B+ Mid': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'Mid' },
        'B+ Low': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'Low' },
    };
    
    const tiers = {};
    players.forEach((player, index) => {
        const tierInfo = tierMap[player.rank];
        if (tierInfo) {
            const tierKey = tierInfo.tier;
            if (!tiers[tierKey]) {
                tiers[tierKey] = { emoji: tierInfo.emoji, subs: { High: [], Mid: [], Low: [] } };
            }
            tiers[tierKey].subs[tierInfo.sub].push({ ...player, position: player.position || index + 1 });
        }
    });
    
    let text = '';
    const tierOrder = ['S Tier', 'A+ Tier', 'A Tier', 'A- Tier', 'B+ Tier'];
    
    tierOrder.forEach(tierName => {
        if (tiers[tierName]) {
            const tier = tiers[tierName];
            text += `# ${tierName} ${tier.emoji}\n`;
            
            ['High', 'Mid', 'Low'].forEach(sub => {
                if (tier.subs[sub].length > 0) {
                    text += `-# ${sub}\n`;
                    tier.subs[sub].forEach(player => {
                        const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
                        text += `## ${player.position} - ${profileLink}\n`;
                    });
                }
            });
            
            text += '\n';
        }
    });
    
    return text;
}

function getStarEmoji(stars) {
    const starEmojiMap = {
        5.0: ':5_star:',
        4.5: ':4pt5_star:',
        4.0: ':4_star:',
        3.5: ':3pt5_star:',
        3.0: ':3_star:',
        2.5: ':2pt5_star:',
        2.0: ':2_star:',
        1.5: ':1pt5_star:',
        1.0: ':1_star:',
        0.5: ':0pt5_star:'
    };
    return starEmojiMap[stars] || '⭐';
}

function getRankEmoji(rank) {
    if (rank.startsWith('S')) {
        return ':STier:';
    } else if (rank.startsWith('A+')) {
        return ':HighTier:';
    } else if (rank.startsWith('A ')) {
        return ':MidTier:';
    } else if (rank.startsWith('A-')) {
        return ':LowTier:';
    } else if (rank.startsWith('B+')) {
        return ':LowTier:';
    }
    return '';
}

function generateFFAExport(players) {
    const starGroups = {};
    players.forEach((player, index) => {
        const stars = player.stars;
        if (!starGroups[stars]) {
            starGroups[stars] = [];
        }
        starGroups[stars].push({ ...player, position: player.position || index + 1 });
    });
    
    let text = '';
    const starOrder = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
    
    starOrder.forEach(stars => {
        if (starGroups[stars]) {
            const starEmoji = getStarEmoji(stars);
            text += `# ${stars} Stars ${starEmoji}\n`;
            starGroups[stars].forEach(player => {
                const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
                text += `## ${player.position} - ${profileLink}\n`;
            });
            text += '\n';
        }
    });
    
    return text;
}

function generateOverallExport(players) {
    let text = '# Overall Leaderboard\n\n';
    players.forEach((player, index) => {
        const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
        const starEmoji = getStarEmoji(player.stars);
        const rankEmoji = getRankEmoji(player.rank);
        text += `## ${index + 1} - ${profileLink} | ${starEmoji} ${player.stars} Stars / ${rankEmoji} ${player.rank}\n`;
    });
    return text;
}

function generateOverallExportMulti(players) {
    const messages = [];
    let currentMessage = '# Overall Leaderboard\n\n';
    const maxLength = 1900;
    
    players.forEach((player, index) => {
        const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
        const starEmoji = getStarEmoji(player.stars);
        const rankEmoji = getRankEmoji(player.rank);
        const playerLine = `## ${index + 1} - ${profileLink} | ${starEmoji} ${player.stars} Stars / ${rankEmoji} ${player.rank}\n`;
        
        if ((currentMessage + playerLine).length > maxLength) {
            messages.push(currentMessage.trim());
            currentMessage = playerLine;
        } else {
            currentMessage += playerLine;
        }
    });
    
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }
    
    return messages;
}

function generateFFAExportMulti(players) {
    const starGroups = {};
    players.forEach((player, index) => {
        const stars = player.stars;
        if (!starGroups[stars]) {
            starGroups[stars] = [];
        }
        starGroups[stars].push({ ...player, position: player.position || index + 1 });
    });
    
    const messages = [];
    let currentMessage = '';
    const maxLength = 1900;
    const starOrder = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
    
    starOrder.forEach(stars => {
        if (starGroups[stars]) {
            const starEmoji = getStarEmoji(stars);
            let starText = `# ${stars} Stars ${starEmoji}\n`;
            starGroups[stars].forEach(player => {
                const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
                starText += `## ${player.position} - ${profileLink}\n`;
            });
            starText += '\n';
            
            if ((currentMessage + starText).length > maxLength) {
                if (currentMessage.trim()) {
                    messages.push(currentMessage.trim());
                }
                currentMessage = starText;
            } else {
                currentMessage += starText;
            }
        }
    });
    
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }
    
    return messages;
}

function generateClassicExportMulti(players) {
    const tierMap = {
        'S High': { tier: 'S Tier', emoji: ':STier:', sub: 'High' },
        'S Mid': { tier: 'S Tier', emoji: ':STier:', sub: 'Mid' },
        'S Low': { tier: 'S Tier', emoji: ':STier:', sub: 'Low' },
        'A+ High': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'High' },
        'A+ Mid': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'Mid' },
        'A+ Low': { tier: 'A+ Tier', emoji: ':HighTier:', sub: 'Low' },
        'A High': { tier: 'A Tier', emoji: ':MidTier:', sub: 'High' },
        'A Mid': { tier: 'A Tier', emoji: ':MidTier:', sub: 'Mid' },
        'A Low': { tier: 'A Tier', emoji: ':MidTier:', sub: 'Low' },
        'A- High': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'High' },
        'A- Mid': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'Mid' },
        'A- Low': { tier: 'A- Tier', emoji: ':LowTier:', sub: 'Low' },
        'B+ High': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'High' },
        'B+ Mid': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'Mid' },
        'B+ Low': { tier: 'B+ Tier', emoji: ':LowTier:', sub: 'Low' },
    };
    
    const tiers = {};
    players.forEach((player, index) => {
        const tierInfo = tierMap[player.rank];
        if (tierInfo) {
            const tierKey = tierInfo.tier;
            if (!tiers[tierKey]) {
                tiers[tierKey] = { emoji: tierInfo.emoji, subs: { High: [], Mid: [], Low: [] } };
            }
            tiers[tierKey].subs[tierInfo.sub].push({ ...player, position: player.position || index + 1 });
        }
    });
    
    const messages = [];
    let currentMessage = '';
    const maxLength = 1900;
    const tierOrder = ['S Tier', 'A+ Tier', 'A Tier', 'A- Tier', 'B+ Tier'];
    
    tierOrder.forEach(tierName => {
        if (tiers[tierName]) {
            const tier = tiers[tierName];
            let tierText = `# ${tierName} ${tier.emoji}\n`;
            
            ['High', 'Mid', 'Low'].forEach(sub => {
                if (tier.subs[sub].length > 0) {
                    tierText += `-# ${sub}\n`;
                    tier.subs[sub].forEach(player => {
                        const profileLink = player.roblox_link ? `[${player.name}](${player.roblox_link})` : player.name;
                        tierText += `## ${player.position} - ${profileLink}\n`;
                    });
                }
            });
            
            tierText += '\n';
            
            if ((currentMessage + tierText).length > maxLength) {
                if (currentMessage.trim()) {
                    messages.push(currentMessage.trim());
                }
                currentMessage = tierText;
            } else {
                currentMessage += tierText;
            }
        }
    });
    
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }
    
    return messages;
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function openImportModal() {
    document.getElementById('importText').value = '';
    document.getElementById('importTarget').value = currentLeaderboardType;
    document.getElementById('importModal').style.display = 'block';
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function parseImportText(text, leaderboardType) {
    const lines = text.split('\n');
    const players = [];
    
    if (leaderboardType === 'classic') {
        let currentTier = '';
        let currentSub = '';
        
        const tierMap = {
            'S Tier': 'S',
            'A+ Tier': 'A+',
            'A Tier': 'A',
            'A- Tier': 'A-',
            'B+ Tier': 'B+'
        };
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('Tier')) {
                for (const [key, val] of Object.entries(tierMap)) {
                    if (line.includes(key)) {
                        currentTier = val;
                        break;
                    }
                }
            } else if (line.startsWith('-# ')) {
                currentSub = line.substring(3).trim();
            } else if (line.startsWith('## ')) {
                let match = line.match(/##\s*(\d+)\s*-\s*\[(.+?)\]\((.+?)\)/);
                let position, name, robloxLink;
                
                if (match) {
                    position = parseInt(match[1]);
                    name = match[2];
                    robloxLink = match[3];
                } else {
                    match = line.match(/##\s*(\d+)\s*-\s*:[^:]*:\s*(.+)/);
                    if (match) {
                        position = parseInt(match[1]);
                        const rest = match[2];
                        const nameMatch = rest.match(/\[(.+?)\]\((.+?)\)|(.+)/);
                        
                        if (nameMatch && nameMatch[1]) {
                            name = nameMatch[1];
                            robloxLink = nameMatch[2];
                        } else if (nameMatch && nameMatch[3]) {
                            name = nameMatch[3];
                            robloxLink = '';
                        }
                    }
                }
                
                if (name) {
                    let rank = '';
                    if (currentTier && currentSub) {
                        rank = `${currentTier} ${currentSub}`;
                    } else if (currentSub) {
                        rank = currentSub;
                    } else if (currentTier) {
                        rank = currentTier;
                    }
                    
                    if (rank) {
                        players.push({
                            name: name.trim(),
                            position: position,
                            rank: rank,
                            roblox_link: robloxLink || ''
                        });
                    }
                }
            }
        }
    } else if (leaderboardType === 'ffa') {
        let currentStars = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ') && !line.startsWith('## ')) {
                const starsMatch = line.match(/(\d+\.?\d*)\s*Stars/);
                if (starsMatch) {
                    currentStars = parseFloat(starsMatch[1]);
                }
            } else if (line.startsWith('## ')) {
                let match = line.match(/##\s*(\d+)\s*-\s*\[(.+?)\]\((.+?)\)/);
                let position, name, robloxLink;
                
                if (match) {
                    position = parseInt(match[1]);
                    name = match[2];
                    robloxLink = match[3];
                    
                    if (name && position && currentStars !== null) {
                        players.push({
                            name: name.trim(),
                            position: position,
                            stars: currentStars,
                            roblox_link: robloxLink || ''
                        });
                    }
                }
            }
        }
    }
    
    return players;
}

function submitImport() {
    const leaderboardType = document.getElementById('importTarget').value;
    const importText = document.getElementById('importText').value;
    
    if (!importText.trim()) {
        alert('Please paste leaderboard data to import');
        return;
    }
    
    const players = parseImportText(importText, leaderboardType);
    
    if (players.length === 0) {
        alert('Could not parse any players from the provided text');
        return;
    }
    
    const confirmMessage = `Are you sure you want to import ${players.length} players into the ${leaderboardType.toUpperCase()} leaderboard? This will replace all existing data.`;
    
    if (confirm(confirmMessage)) {
        fetch(`/api/leaderboards/${leaderboardType}/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ players: players })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Leaderboard imported successfully!');
                closeImportModal();
                loadPlayers();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error importing leaderboard');
        });
    }
}

function copyExportText() {
    const textarea = document.getElementById('exportText');
    const text = textarea.value;
    const messageCount = (text.match(/\n\n---\n\n/g) || []).length + 1;
    
    textarea.select();
    document.execCommand('copy');
    
    if (messageCount > 1) {
        alert(`Copied ${messageCount} messages to clipboard!\n\nPaste each message (separated by ---) into Discord as individual messages.`);
    } else {
        alert('Copied to clipboard!');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    currentLeaderboardType = getLeaderboardType();
    updateFormFields();
    loadPlayers();
});

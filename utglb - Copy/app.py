from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)
DATA_FILES = {
    'ffa': 'leaderboard_ffa.json',
    'classic': 'leaderboard_classic.json'
}

class Leaderboard:
    RANK_POINTS = {
        "B+ Low": 1,
        "B+ Mid": 2,
        "B+ High": 3,
        "A- Low": 4,
        "A- Mid": 5,
        "A- High": 6,
        "A Low": 7,
        "A Mid": 8,
        "A High": 9,
        "A+ Low": 10,
        "A+ Mid": 11,
        "A+ High": 12,
        "S Low": 13,
        "S Mid": 14,
        "S High": 15,
    }
    
    STAR_POINTS = {
        0.5: 1.5,
        1.0: 3.0,
        1.5: 4.5,
        2.0: 6.0,
        2.5: 7.5,
        3.0: 9.0,
        3.5: 10.5,
        4.0: 12.0,
        4.5: 13.5,
        5.0: 15.0,
    }
    
    MAX_RANK_POINTS = 15
    MAX_STAR_POINTS = 15
    
    def __init__(self, leaderboard_type='classic'):
        self.leaderboard_type = leaderboard_type
        self.data_file = DATA_FILES[leaderboard_type]
        self.players = []
        self.load_data()
    
    def add_player(self, name, position=None, rank=None, stars=None, roblox_link=""):
        if self.leaderboard_type == 'classic':
            if rank not in self.RANK_POINTS:
                raise ValueError(f"Invalid rank: {rank}")
            
            rank_points = self.RANK_POINTS[rank]
            rank_percentage = (rank_points / self.MAX_RANK_POINTS) * 100
            
            player = {
                "name": name,
                "rank": rank,
                "rank_points": rank_points,
                "rank_percentage": rank_percentage,
                "roblox_link": roblox_link,
            }
            
            if position is not None:
                player["position"] = position
                for p in self.players:
                    if p.get("position") is not None and p.get("position") > position:
                        p["position"] = p.get("position") + 1
                self.players.insert(position - 1, player)
            else:
                self.players.append(player)
        
        elif self.leaderboard_type == 'ffa':
            if stars not in self.STAR_POINTS:
                raise ValueError(f"Invalid star rating: {stars}")
            
            star_points = self.STAR_POINTS[stars]
            star_percentage = (star_points / self.MAX_STAR_POINTS) * 100
            
            player = {
                "name": name,
                "stars": stars,
                "star_points": star_points,
                "star_percentage": star_percentage,
                "roblox_link": roblox_link,
            }
            
            if position is not None:
                player["position"] = position
                for p in self.players:
                    if p.get("position") is not None and p.get("position") > position:
                        p["position"] = p.get("position") + 1
                self.players.insert(position - 1, player)
            else:
                self.players.append(player)
    
    def remove_player(self, name):
        removed_position = None
        for i, p in enumerate(self.players):
            if p["name"] == name:
                removed_position = p.get("position")
                self.players.pop(i)
                break
        
        if removed_position is not None:
            for p in self.players:
                if p.get("position") is not None and p.get("position") > removed_position:
                    p["position"] = p.get("position") - 1
    
    def swap_positions(self, name1, name2):
        player1 = None
        player2 = None
        
        for p in self.players:
            if p["name"] == name1:
                player1 = p
            elif p["name"] == name2:
                player2 = p
        
        if not player1 or not player2:
            raise ValueError("One or both players not found")
        
        pos1 = player1.get("position")
        pos2 = player2.get("position")
        
        player1["position"] = pos2
        player2["position"] = pos1
    
    def update_player(self, old_name, new_name, rank=None, stars=None, roblox_link="", position=None):
        for i, player in enumerate(self.players):
            if player["name"] == old_name:
                old_position = player.get("position")
                
                if self.leaderboard_type == 'classic':
                    if rank not in self.RANK_POINTS:
                        raise ValueError(f"Invalid rank: {rank}")
                    
                    rank_points = self.RANK_POINTS[rank]
                    rank_percentage = (rank_points / self.MAX_RANK_POINTS) * 100
                    
                    player["name"] = new_name
                    player["rank"] = rank
                    player["rank_points"] = rank_points
                    player["rank_percentage"] = rank_percentage
                    player["roblox_link"] = roblox_link
                    
                    if position is not None and position != old_position:
                        self.players.pop(i)
                        if old_position is not None:
                            for p in self.players:
                                if p.get("position") is not None and p.get("position") > old_position:
                                    p["position"] = p.get("position") - 1
                        
                        for p in self.players:
                            if p.get("position") is not None and p.get("position") > position:
                                p["position"] = p.get("position") + 1
                        
                        player["position"] = position
                        self.players.insert(position - 1, player)
                
                elif self.leaderboard_type == 'ffa':
                    if stars not in self.STAR_POINTS:
                        raise ValueError(f"Invalid star rating: {stars}")
                    
                    star_points = self.STAR_POINTS[stars]
                    star_percentage = (star_points / self.MAX_STAR_POINTS) * 100
                    
                    player["name"] = new_name
                    player["stars"] = stars
                    player["star_points"] = star_points
                    player["star_percentage"] = star_percentage
                    player["roblox_link"] = roblox_link
                    
                    if position is not None and position != old_position:
                        self.players.pop(i)
                        if old_position is not None:
                            for p in self.players:
                                if p.get("position") is not None and p.get("position") > old_position:
                                    p["position"] = p.get("position") - 1
                        
                        for p in self.players:
                            if p.get("position") is not None and p.get("position") > position:
                                p["position"] = p.get("position") + 1
                        
                        player["position"] = position
                        self.players.insert(position - 1, player)
                
                return
        
        raise ValueError(f"Player not found: {old_name}")
    
    def get_players(self):
        if self.leaderboard_type == 'ffa':
            self.players.sort(key=lambda p: (p.get("position") is not None, p.get("position", float('inf')), -p.get("star_points", 0)))
        elif self.leaderboard_type == 'classic':
            self.players.sort(key=lambda p: (p.get("position") is not None, p.get("position", float('inf')), -p.get("rank_points", 0)))
        return self.players
    
    def save_data(self):
        with open(self.data_file, 'w') as f:
            json.dump(self.players, f, indent=2)
    
    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                self.players = json.load(f)

leaderboards = {
    'ffa': Leaderboard('ffa'),
    'classic': Leaderboard('classic')
}

def get_current_leaderboard(lb_type):
    return leaderboards.get(lb_type, leaderboards['classic'])

@app.route('/')
def index():
    lb = get_current_leaderboard('classic')
    return render_template('index.html', 
                         leaderboard_type='classic',
                         ranks=list(lb.RANK_POINTS.keys()),
                         stars=sorted(lb.STAR_POINTS.keys()))

@app.route('/ffa')
def ffa():
    lb = get_current_leaderboard('ffa')
    return render_template('index.html', 
                         leaderboard_type='ffa',
                         ranks=list(lb.RANK_POINTS.keys()),
                         stars=sorted(lb.STAR_POINTS.keys()))

@app.route('/classic')
def classic():
    lb = get_current_leaderboard('classic')
    return render_template('index.html', 
                         leaderboard_type='classic',
                         ranks=list(lb.RANK_POINTS.keys()),
                         stars=sorted(lb.STAR_POINTS.keys()))

@app.route('/api/players/<lb_type>', methods=['GET'])
def get_players(lb_type):
    lb = get_current_leaderboard(lb_type)
    return jsonify(lb.get_players())

@app.route('/api/players/<lb_type>', methods=['POST'])
def add_player(lb_type):
    lb = get_current_leaderboard(lb_type)
    data = request.json
    try:
        if lb_type == 'classic':
            lb.add_player(data['name'], None, data['rank'], None, data.get('roblox_link', ''))
        elif lb_type == 'ffa':
            lb.add_player(data['name'], None, None, float(data['stars']), data.get('roblox_link', ''))
        
        lb.save_data()
        return jsonify({"success": True, "players": lb.get_players()})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/players/<lb_type>/<old_name>', methods=['PUT'])
def update_player(lb_type, old_name):
    lb = get_current_leaderboard(lb_type)
    data = request.json
    try:
        new_name = data.get('new_name', old_name)
        position = data.get('position')
        
        if lb_type == 'classic':
            lb.update_player(old_name, new_name, data['rank'], None, data.get('roblox_link', ''), position)
        elif lb_type == 'ffa':
            lb.update_player(old_name, new_name, None, float(data['stars']), data.get('roblox_link', ''), position)
        
        lb.save_data()
        return jsonify({"success": True, "players": lb.get_players()})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/players/<lb_type>/<name>', methods=['DELETE'])
def remove_player(lb_type, name):
    lb = get_current_leaderboard(lb_type)
    lb.remove_player(name)
    lb.save_data()
    return jsonify({"success": True, "players": lb.get_players()})

@app.route('/api/players/<lb_type>/delete-all', methods=['DELETE'])
def delete_all_players(lb_type):
    lb = get_current_leaderboard(lb_type)
    lb.players = []
    lb.save_data()
    return jsonify({"success": True, "players": lb.get_players()})

@app.route('/api/players/<lb_type>/swap', methods=['POST'])
def swap_positions(lb_type):
    lb = get_current_leaderboard(lb_type)
    data = request.json
    name1 = data.get('name1')
    name2 = data.get('name2')
    
    if not name1 or not name2:
        return jsonify({"success": False, "error": "name1 and name2 required"}), 400
    
    try:
        lb.swap_positions(name1, name2)
        lb.save_data()
        return jsonify({"success": True, "players": lb.get_players()})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/leaderboards/<lb_type>/import', methods=['POST'])
def import_leaderboard(lb_type):
    lb = get_current_leaderboard(lb_type)
    data = request.json
    players_data = data.get('players', [])
    
    if not players_data:
        return jsonify({"success": False, "error": "No players provided"}), 400
    
    try:
        lb.players = []
        
        for player in players_data:
            if lb_type == 'classic':
                if not player.get('rank'):
                    continue
                rank = player['rank']
                if rank not in lb.RANK_POINTS:
                    continue
                    
                rank_points = lb.RANK_POINTS[rank]
                rank_percentage = (rank_points / lb.MAX_RANK_POINTS) * 100
                
                player_obj = {
                    "name": player['name'],
                    "rank": rank,
                    "rank_points": rank_points,
                    "rank_percentage": rank_percentage,
                    "roblox_link": player.get('roblox_link', ''),
                }
                if player.get('position'):
                    player_obj["position"] = player['position']
                    
                lb.players.append(player_obj)
            elif lb_type == 'ffa':
                if player.get('stars') is None:
                    continue
                stars = float(player['stars'])
                if stars not in lb.STAR_POINTS:
                    continue
                    
                star_points = lb.STAR_POINTS[stars]
                star_percentage = (star_points / lb.MAX_STAR_POINTS) * 100
                
                player_obj = {
                    "name": player['name'],
                    "stars": stars,
                    "star_points": star_points,
                    "star_percentage": star_percentage,
                    "roblox_link": player.get('roblox_link', ''),
                }
                if player.get('position'):
                    player_obj["position"] = player['position']
                    
                lb.players.append(player_obj)
        
        lb.save_data()
        return jsonify({"success": True, "players": lb.get_players()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)

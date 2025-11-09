import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

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
    
    def __init__(self):
        self.players = []
    
    def add_player(self, name, rank, stars):
        if rank not in self.RANK_POINTS:
            raise ValueError(f"Invalid rank: {rank}")
        if stars not in self.STAR_POINTS:
            raise ValueError(f"Invalid star rating: {stars}")
        
        rank_points = self.RANK_POINTS[rank]
        star_points = self.STAR_POINTS[stars]
        
        rank_percentage = (rank_points / self.MAX_RANK_POINTS) * 100
        star_percentage = (star_points / self.MAX_STAR_POINTS) * 100
        
        final_score = (rank_percentage + star_percentage) / 2
        
        self.players.append({
            "name": name,
            "rank": rank,
            "stars": stars,
            "rank_points": rank_points,
            "star_points": star_points,
            "rank_percentage": rank_percentage,
            "star_percentage": star_percentage,
            "final_score": final_score,
        })
    
    def remove_player(self, name):
        self.players = [p for p in self.players if p["name"] != name]
    
    def sort_leaderboard(self):
        self.players.sort(key=lambda p: p["final_score"], reverse=True)
    
    def get_formatted_display(self):
        self.sort_leaderboard()
        if not self.players:
            return "No players on leaderboard yet."
        
        output = "\n" + "=" * 100 + "\n"
        output += f"{'Rank':<6} {'Name':<20} {'Rank Tier':<15} {'Stars':<8} {'Rank %':<12} {'Stars %':<12} {'Final Score':<12}\n"
        output += "=" * 100 + "\n"
        
        for position, player in enumerate(self.players, 1):
            output += f"{position:<6} {player['name']:<20} {player['rank']:<15} {player['stars']:<8.1f} {player['rank_percentage']:<12.2f} {player['star_percentage']:<12.2f} {player['final_score']:<12.2f}\n"
        
        output += "=" * 100 + "\n"
        return output


class LeaderboardGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Leaderboard System")
        self.root.geometry("900x700")
        self.leaderboard = Leaderboard()
        
        self.create_widgets()
    
    def create_widgets(self):
        frame = ttk.Frame(self.root, padding="10")
        frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        ttk.Label(frame, text="Leaderboard System", font=("Arial", 16, "bold")).grid(row=0, column=0, columnspan=3, pady=10)
        
        ttk.Label(frame, text="Player Name:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.name_entry = ttk.Entry(frame, width=20)
        self.name_entry.grid(row=1, column=1, sticky=tk.W, padx=5)
        
        ttk.Label(frame, text="Rank Tier:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.rank_var = tk.StringVar()
        self.rank_combo = ttk.Combobox(frame, textvariable=self.rank_var, values=list(self.leaderboard.RANK_POINTS.keys()), width=17)
        self.rank_combo.grid(row=2, column=1, sticky=tk.W, padx=5)
        
        ttk.Label(frame, text="Star Rating:").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.star_var = tk.StringVar()
        self.star_combo = ttk.Combobox(frame, textvariable=self.star_var, values=[str(s) for s in self.leaderboard.STAR_POINTS.keys()], width=17)
        self.star_combo.grid(row=3, column=1, sticky=tk.W, padx=5)
        
        ttk.Button(frame, text="Add Player", command=self.add_player).grid(row=4, column=1, sticky=tk.W, padx=5, pady=10)
        
        ttk.Label(frame, text="Leaderboard:").grid(row=5, column=0, columnspan=2, sticky=tk.W, pady=(20, 5))
        
        self.display_text = scrolledtext.ScrolledText(frame, width=100, height=25, font=("Courier", 9))
        self.display_text.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        self.display_text.config(state=tk.DISABLED)
        
        button_frame = ttk.Frame(frame)
        button_frame.grid(row=7, column=0, columnspan=3, pady=10)
        
        ttk.Button(button_frame, text="Refresh", command=self.refresh_display).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Remove Player", command=self.remove_player).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Clear All", command=self.clear_all).pack(side=tk.LEFT, padx=5)
        
        self.refresh_display()
    
    def add_player(self):
        name = self.name_entry.get().strip()
        rank = self.rank_var.get()
        star = self.star_var.get()
        
        if not name or not rank or not star:
            messagebox.showerror("Error", "Please fill in all fields.")
            return
        
        try:
            self.leaderboard.add_player(name, rank, float(star))
            messagebox.showinfo("Success", f"Added {name} to leaderboard!")
            self.name_entry.delete(0, tk.END)
            self.rank_var.set("")
            self.star_var.set("")
            self.refresh_display()
        except ValueError as e:
            messagebox.showerror("Error", str(e))
    
    def remove_player(self):
        name = self.name_entry.get().strip()
        if not name:
            messagebox.showerror("Error", "Enter a player name to remove.")
            return
        
        self.leaderboard.remove_player(name)
        messagebox.showinfo("Success", f"Removed {name} from leaderboard!")
        self.name_entry.delete(0, tk.END)
        self.refresh_display()
    
    def clear_all(self):
        if messagebox.askyesno("Confirm", "Remove all players?"):
            self.leaderboard.players.clear()
            self.refresh_display()
    
    def refresh_display(self):
        self.display_text.config(state=tk.NORMAL)
        self.display_text.delete(1.0, tk.END)
        self.display_text.insert(tk.END, self.leaderboard.get_formatted_display())
        self.display_text.config(state=tk.DISABLED)


if __name__ == "__main__":
    root = tk.Tk()
    gui = LeaderboardGUI(root)
    root.mainloop()

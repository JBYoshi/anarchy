levels = [
    {"rank": "C-", "entry": 0, "win": 20, "start": 0, "end": 200, "rankupbattle": False},
    {"rank": "C", "entry": 20, "win": 20, "start": 200, "end": 400, "rankupbattle": False},
    {"rank": "C+", "entry": 40, "win": 20, "start": 400, "end": 600, "rankupbattle": True},
    {"rank": "B-", "entry": 55, "win": 30, "start": 100, "end": 350, "rankupbattle": False},
    {"rank": "B", "entry": 70, "win": 30, "start": 350, "end": 600, "rankupbattle": False},
    {"rank": "B+", "entry": 85, "win": 30, "start": 600, "end": 850, "rankupbattle": True},
    {"rank": "A-", "entry": 110, "win": 40, "start": 200, "end": 500, "rankupbattle": False},
    {"rank": "A", "entry": 120, "win": 40, "start": 500, "end": 800, "rankupbattle": False},
    {"rank": "A+", "entry": 130, "win": 40, "start": 800, "end": 1100, "rankupbattle": True},
    {"rank": "S", "entry": 170, "win": 50, "start": 300, "end": 1000, "rankupbattle": True},
    {"rank": "S+", "entry": 180, "win": 50, "start": 300, "end": 1000000000000000, "rankupbattle": False}  # TODO
]

jb_tips_mode = True
if jb_tips_mode:
    print()
    print("Quick tips before you go")
    print("========================")
    print()
    print("- Try to stick with the group")
    print("- Use Anarchy Open to practice modes you aren't the best at")
#    print('  @dot: "Don\'t be afraid to play anarchy open to gain points. In fact, as an S+')
#    print('  player, i HIGHLY recommend going into open right after you get into S+, instead')
#    print('  of series. Once you are comfortable enough to play with other S+ players, then')
#    print('  start playing series."')
    print("- Back up to use specials")
    print()
    import time
    #time.sleep(4)  # TODO

curr_rank = input("What's your current rank? ")
curr_score = int(input("What's your current score? "))
curr_state = input("Are you in a series right now? (n = no, y = yes, r = rank up) ")

curr_wins = 0
curr_losses = 0
curr_gold = 0
curr_silver = 0


def calc_win_score(wins, base, gold, silver):
    out = 0
    for i in range(wins):
        out += base
        base += 5
    return out + gold * 5 + silver


def prorate_payment(wins, losses, payment):
    return (wins * 3 + losses * 5 - wins * losses) / 15 * payment


while True:
    rank_details = [x for x in levels if x["rank"] == curr_rank][0]

    print(curr_rank + " " + str(curr_score) + "/" + str(rank_details["end"]))
    if curr_state == "n":
        print("No series in progress")
    elif curr_state == "y":
        print("Series in progress: "
              + str(curr_wins) + " wins, "
              + str(curr_losses) + " losses, "
              + str(curr_gold) + " gold, "
              + str(curr_silver) + " silver")
        curr_winnings = calc_win_score(curr_wins, rank_details["win"], curr_gold, curr_silver)
        curr_paid = prorate_payment(curr_wins, curr_losses, rank_details["entry"])
        print("Effective score: " + str(round(curr_score + curr_winnings + rank_details["entry"] - curr_paid, 1))
            + " (won " + str(curr_winnings) + ", paid " + str(round(curr_paid, 1)) + "/" + str(rank_details["entry"]) + ")")

    elif curr_state == "r":
        print("Rank-up battle in progress: " + str(curr_wins) + " wins, " + str(curr_losses) + " losses")

    print()

    if curr_state == "n":
        if curr_score >= rank_details["end"] and rank_details["rankupbattle"]:
            input("Press Enter to begin a rank-up battle.")
            curr_score -= rank_details["entry"]
            curr_state = "r"
        else:
            input("Press Enter to begin a series.")
            curr_score -= rank_details["entry"]
            curr_state = "y"
        continue

    print("Enter w = win, l = lose, g = gold, s = silver (ex: wggs = win with 2 gold 1 silver)")
    for c in input("> "):
        if c == "w":
            curr_wins += 1
        elif c == "l":
            curr_losses += 1
        elif c == "g":
            curr_gold += 1
        elif c == "s":
            curr_silver += 1
    
    if curr_state == "y" and (curr_wins >= 5 or curr_losses >= 3):
        print("Series complete: "
              + str(curr_wins) + " wins, "
              + str(curr_losses) + " losses, "
              + str(curr_gold) + " gold, "
              + str(curr_silver) + " silver")
        curr_score += calc_win_score(curr_wins, rank_details["win"], curr_gold, curr_silver)
        curr_wins = 0
        curr_losses = 0
        curr_gold = 0
        curr_silver = 0
        curr_state = "n"

        if curr_score >= rank_details["end"] and not rank_details["rankupbattle"]:
            next_rank = levels[levels.index(rank_details) + 1]
            curr_rank = next_rank["rank"]
    elif curr_state == "r" and (curr_wins >= 3 or curr_losses >= 3):
        print("Rank-up complete: " + str(curr_wins) + " wins, " + str(curr_losses) + " losses")
        if curr_wins >= 3:
            next_rank = levels[levels.index(rank_details) + 1]
            curr_score = next_rank["start"]
            curr_rank = next_rank["rank"]
        curr_wins = 0
        curr_losses = 0
        curr_gold = 0
        curr_silver = 0
        curr_state = "n"

from app.main import app

def run():
    assert app is not None
    print("SMOKE OK")

if __name__ == "__main__":
    run()

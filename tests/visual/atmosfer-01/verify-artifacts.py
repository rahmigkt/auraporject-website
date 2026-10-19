from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('verify-current-artifacts.py')),run_name='__main__')

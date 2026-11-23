import json
from collections import Counter
from pathlib import Path
def test_dataset():
    rows=json.loads(Path(__file__).with_name('messages.json').read_text(encoding='utf8'))
    assert len({(r['l'],r['q']) for r in rows}) == 300
    assert set(Counter(r['l'] for r in rows).values()) == {50}
    assert sum(r['intent']=='safety' for r in rows)==150


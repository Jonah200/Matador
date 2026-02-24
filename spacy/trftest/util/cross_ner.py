import numpy as np
import os
import json
import pandas as pd
from typing import Literal

def process_cross_ner(data_type: Literal['dev', 'train', 'test']) -> None:
    pathname = f'./data/crossNER/{data_type}.txt'
    with open(pathname, 'r') as file:
        for line in file:
            
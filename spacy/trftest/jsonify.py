import json


def convert_to_json_string(pathname: str, output: str):
    pathname = 'articles/text/' + pathname
    output = 'articles/json/' + output
    with open(pathname, 'r', encoding='utf-8') as file:
        text = file.read()
        data = {
            "title" : "",
            "link" : "",
            "outlet" : "",
            "authors" : [],
            "text" : text
        }

    with open(output, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)


if __name__ == "__main__":
    for i in range(2, 6):
        convert_to_json_string(f'article_{i}.txt', f'article_{i}.json')
    
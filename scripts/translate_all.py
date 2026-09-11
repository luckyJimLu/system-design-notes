import re
import urllib.request
import urllib.parse
import json
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor

def translate_batch(texts: list[str], sl: str, tl: str) -> list[str]:
    if not texts:
        return []
    
    DELIM = "\n---SEG_BREAK---\n"
    combined = DELIM.join(texts)
    
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=' + tl + '&dt=t&q=' + urllib.parse.quote(combined)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                data = json.loads(res.read().decode('utf-8'))
                translated_full = ''.join([part[0] for part in data[0] if part and part[0]])
                
                parts = re.split(r'\n?\s*---\s*SEG_BREAK\s*---\s*\n?', translated_full)
                if len(parts) == len(texts):
                    return parts
                break
        except Exception as e:
            time.sleep(1 + attempt * 1.5)
            
    # Fallback to individual
    results = []
    for t in texts:
        if not t.strip() or re.match(r'^[\d\s\-_.,:;!@#$%^&*()=+\[\]{}|\\/<>`~"\'?]+$', t.strip()):
            results.append(t)
            continue
        sub_url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=' + tl + '&dt=t&q=' + urllib.parse.quote(t)
        sub_req = urllib.request.Request(sub_url, headers={'User-Agent': 'Mozilla/5.0'})
        done = False
        for a in range(3):
            try:
                with urllib.request.urlopen(sub_req, timeout=12) as r:
                    d = json.loads(r.read().decode('utf-8'))
                    res_t = ''.join([p[0] for p in d[0] if p and p[0]])
                    results.append(res_t)
                    done = True
                    break
            except:
                time.sleep(0.5)
        if not done:
            results.append(t)
    return results

def translate_markdown(content: str, sl: str, tl: str) -> str:
    # 1. Protect code blocks: ``` ... ```
    code_blocks = []
    def save_code_block(m):
        code_blocks.append(m.group(0))
        return f"\n%%CODEBLOCK_{len(code_blocks)-1}%%\n"
    content_clean = re.sub(r'```[\s\S]*?```', save_code_block, content)

    # 2. Protect HTML blocks e.g. <div ...> or <img ... />
    html_blocks = []
    def save_html(m):
        html_blocks.append(m.group(0))
        return f"%%HTMLBLOCK_{len(html_blocks)-1}%%"
    content_clean = re.sub(r'<[^>]+>', save_html, content_clean)

    # 3. Protect markdown images ![alt](url)
    md_images = []
    def save_image(m):
        md_images.append(m.group(0))
        return f"%%MDIMAGE_{len(md_images)-1}%%"
    content_clean = re.sub(r'!\[.*?\]\(.*?\)', save_image, content_clean)

    # 4. Protect inline code `...`
    inline_codes = []
    def save_inline(m):
        inline_codes.append(m.group(0))
        return f"ZZCODE{len(inline_codes)-1}ZZ"
    content_clean = re.sub(r'`[^`\n]+`', save_inline, content_clean)

    # 5. Protect markdown links [text](url) -> [«LINKTEXT_X»](url)
    link_urls = []
    def save_link(m):
        txt = m.group(1)
        url = m.group(2)
        link_urls.append(url)
        return f"[{txt}](ZZLINK{len(link_urls)-1}ZZ)"
    content_clean = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', save_link, content_clean)

    # Split into lines
    lines = content_clean.split('\n')
    items_to_translate = []
    
    for idx, line in enumerate(lines):
        sline = line.strip()
        if not sline or sline in ['---', '***', '___']:
            continue
        if sline.startswith('%%CODEBLOCK_') or sline.startswith('%%HTMLBLOCK_') or sline.startswith('%%MDIMAGE_'):
            continue
        if re.match(r'^\s*\|[\s\-:|]+\|\s*$', line):
            continue
        
        # Table row
        if sline.startswith('|') and sline.endswith('|'):
            cells = line.split('|')
            for c_idx, cell in enumerate(cells):
                if c_idx > 0 and c_idx < len(cells) - 1:
                    c_str = cell.strip()
                    if c_str and not re.match(r'^[\d\s\-_.,:;!@#$%^&*()=+\[\]{}|\\/<>`~"\'?]+$', c_str):
                        items_to_translate.append((idx, f"table_{c_idx}", "", c_str))
            continue

        # Heading
        h_match = re.match(r'^(#{1,6}\s+)(.*)$', line)
        if h_match:
            items_to_translate.append((idx, "heading", h_match.group(1), h_match.group(2)))
            continue

        # List
        l_match = re.match(r'^(\s*[-*+]\s+|\s*\d+\.\s+)(.*)$', line)
        if l_match:
            items_to_translate.append((idx, "list", l_match.group(1), l_match.group(2)))
            continue

        # Blockquote
        b_match = re.match(r'^(\s*>\s*)(.*)$', line)
        if b_match:
            items_to_translate.append((idx, "quote", b_match.group(1), b_match.group(2)))
            continue

        # Normal line
        items_to_translate.append((idx, "text", "", line))

    # Batch translate items
    BATCH_SIZE = 30
    all_translated_items = []
    
    raw_texts = [item[3] for item in items_to_translate]
    for b_start in range(0, len(raw_texts), BATCH_SIZE):
        batch = raw_texts[b_start : b_start + BATCH_SIZE]
        translated_batch = translate_batch(batch, sl, tl)
        all_translated_items.extend(translated_batch)

    # Reconstruct lines
    table_cell_map = {}
    
    for i, (line_idx, item_type, prefix, orig_text) in enumerate(items_to_translate):
        tr_text = all_translated_items[i] if i < len(all_translated_items) else orig_text
        if item_type.startswith("table_"):
            c_idx = int(item_type.split("_")[1])
            if line_idx not in table_cell_map:
                table_cell_map[line_idx] = {}
            table_cell_map[line_idx][c_idx] = tr_text.strip()
        elif item_type == "heading":
            lines[line_idx] = prefix + tr_text.strip()
        elif item_type in ["list", "quote"]:
            lines[line_idx] = prefix + tr_text.strip()
        else:
            lines[line_idx] = tr_text

    for line_idx, cell_dict in table_cell_map.items():
        cells = lines[line_idx].split('|')
        for c_idx, tr in cell_dict.items():
            if c_idx < len(cells):
                cells[c_idx] = f" {tr} "
        lines[line_idx] = '|'.join(cells)

    reconstructed = '\n'.join(lines)

    # Restore link URLs
    for idx, url in enumerate(link_urls):
        reconstructed = re.sub(r'ZZLINK' + str(idx) + r'ZZ', lambda m: url, reconstructed)

    # Restore inline code (flexible match for spaces or quotes added by translation)
    for idx, code in enumerate(inline_codes):
        pattern = r'ZZCODE' + str(idx) + r'ZZ'
        reconstructed = re.sub(pattern, lambda m: code, reconstructed)

    # Restore markdown images
    for idx, img in enumerate(md_images):
        reconstructed = reconstructed.replace(f"%%MDIMAGE_{idx}%%", img)

    # Restore HTML blocks
    for idx, html in enumerate(html_blocks):
        reconstructed = reconstructed.replace(f"%%HTMLBLOCK_{idx}%%", html)

    # Restore code blocks
    for idx, code in enumerate(code_blocks):
        reconstructed = reconstructed.replace(f"%%CODEBLOCK_{idx}%%", code)

    return reconstructed

def process_file(src_path: str, dst_path: str, sl: str, tl: str):
    print(f"Translating {src_path} -> {dst_path} ({sl} -> {tl})...")
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
    tr = translate_markdown(content, sl, tl)
    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(tr)
    print(f"Finished {dst_path}")

def run():
    tasks = []
    
    # 1. System design chapters (English -> Chinese)
    for folder in sorted(os.listdir('.')):
        if re.match(r'^\d+\..*', folder) and os.path.isdir(folder):
            en_file = None
            for cand in ['Readme.md', 'README.md']:
                p = os.path.join(folder, cand)
                if os.path.exists(p):
                    en_file = p
                    break
            if en_file:
                zh_file = os.path.join(folder, 'Readme.zh.md')
                tasks.append((en_file, zh_file, 'en', 'zh-CN'))

    # 2. Embedded systems chapters (Chinese -> English)
    embedded_dirs = ['embedded-systems/rtos', 'embedded-systems/modemlog']
    for edir in embedded_dirs:
        if os.path.exists(edir):
            for fname in sorted(os.listdir(edir)):
                if fname.endswith('.md') and not fname.endswith('.en.md') and not fname.endswith('.zh.md') and fname.lower() != 'readme.md':
                    src_file = os.path.join(edir, fname)
                    dst_file = os.path.join(edir, fname[:-3] + '.en.md')
                    tasks.append((src_file, dst_file, 'zh-CN', 'en'))

    print(f"Total files to translate: {len(tasks)}")
    
    # Run with 4 worker threads for optimal balance of speed and rate-limiting safety
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process_file, t[0], t[1], t[2], t[3]) for t in tasks]
        for f in futures:
            try:
                f.result()
            except Exception as e:
                print(f"Task error: {e}")

if __name__ == '__main__':
    run()

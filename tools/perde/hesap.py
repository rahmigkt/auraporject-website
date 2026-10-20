"""PERDE-01: ölçüye dayalı ön metraj. mm girdiler; üretim emri değildir."""
import argparse
import json
import sys
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'knowledge/ev-projesi/veri'


def load(name):
    return json.loads((DATA / name).read_text(encoding='utf-8'))


def number(value, name, zero=False):
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise ValueError(f'{name}: sonlu sayı gerekli')
    try:
        result = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(f'{name}: sayı gerekli') from exc
    if not result.is_finite() or result < 0 or (not zero and result == 0):
        raise ValueError(f'{name}: geçersiz ölçü')
    return result


def ceil(value):
    return int(value.to_integral_value(rounding=ROUND_CEILING))


def calculate(request):
    """No country stereotypes, hidden shrink factors, or automatic blind deductions."""
    config = load('perde-hesap.json')
    if request.get('country') not in load('perde-kulturu.json')['countries']:
        raise ValueError('country: desteklenmeyen ülke')
    if request.get('unit') != 'mm':
        raise ValueError('unit: mm zorunlu')
    if request.get('geometry') != 'straight':
        raise ValueError('Düz açıklık gerekli; cumba/eğri ray ayrı segment ve donanım ister')
    kind = request.get('kind')
    if kind not in ('curtain', 'blind'):
        raise ValueError('kind: curtain veya blind')
    warnings = ['Ön metraj; yerinde ölçü, taşıyıcı yüzey ve ürün donanımı tasarımcı/uygulamacı tarafından doğrulanmalı.']
    if kind == 'blind':
        profile_id = request.get('blind_profile')
        if profile_id not in config['blind_profiles']:
            raise ValueError('Ürüne ait blind_profile seçilmeli')
        profile = config['blind_profiles'][profile_id]
        if request.get('mount') != profile['mount']:
            raise ValueError('Stor profili ile montaj uyuşmuyor')
        if request.get('measurement_stage') != 'raw_opening':
            raise ValueError('Pay düşülmemiş ham açıklık ölçüsü gerekli')
        widths = request.get('widths_mm', [])
        heights = request.get('heights_mm', [])
        if len(widths) != 3 or len(heights) != 3:
            raise ValueError('Üç en ve üç boy ölçüsü gerekli')
        select = max if profile['mount'] == 'outside' else min
        width = select(number(v, 'widths_mm') for v in widths)
        height = select(number(v, 'heights_mm') for v in heights)
        order_width = width - Decimal(str(profile['deduct_width_mm']))
        order_height = height - Decimal(str(profile['deduct_height_mm']))
        if min(order_width, order_height) <= 0:
            raise ValueError('Düşüm sonrası ölçü pozitif olmalı')
        warnings.append('Kumaş eni kasa/en ölçüsü değildir; mekanizma farkı bilinmiyor. Derinlik, kol ve açılım yerinde kontrol edilmeli.')
        return dict(kind=kind, order_width_mm=str(order_width), order_height_mm=str(order_height),
                    cloth_width_mm=None, panel_count=1, production_ready=False,
                    profile=profile_id, source_ids=profile['source_ids'], warnings=warnings)
    heading = request.get('heading')
    if heading not in config['headings']:
        raise ValueError('Bilinmeyen başlık')
    fullness = number(request.get('fullness'), 'fullness')
    bounds = config['headings'][heading]['estimation_range']
    if not Decimal(str(bounds[0])) <= fullness <= Decimal(str(bounds[1])):
        raise ValueError('Büzgü katsayısı seçilen başlık tahmin aralığı dışında')
    panels = request.get('panel_count')
    if type(panels) is not int or panels not in (1, 2):
        raise ValueError('panel_count: bir düz açıklık için 1 veya 2')
    mount_id = request.get('mount_profile')
    if mount_id not in config['mount_profiles']:
        raise ValueError('mount_profile seçilmeli')
    mount = config['mount_profiles'][mount_id]
    if request.get('mount') not in ('ceiling', 'wall', 'rod'):
        raise ValueError('mount: ceiling, wall veya rod')
    window = number(request.get('window_width_mm'), 'window_width_mm')
    number(request.get('window_height_mm'), 'window_height_mm')
    rail = number(request['rail_width_mm'], 'rail_width_mm') if 'rail_width_mm' in request else window + 2 * Decimal(str(mount['side_extension_mm']))
    if rail < window:
        raise ValueError('Ray pencere eninden kısa; açıklık yeniden ölçülmeli')
    # Drop is measured from the actual attachment datum, not window height.
    if request.get('drop_datum') not in ('hook_bearing', 'wave_track_underside', 'rod_top'):
        raise ValueError('drop_datum: gerçek askı referansı gerekli')
    if heading == 'wave' and request['drop_datum'] != 'wave_track_underside':
        raise ValueError('Wave boyu ray altından ölçülmeli')
    if heading == 'wave' and request['mount'] == 'rod':
        raise ValueError('Bu wave profili uyumlu ray gerektirir')
    if heading in ('eyelet', 'rod_pocket') and (request['drop_datum'] != 'rod_top' or request['mount'] != 'rod'):
        raise ValueError('Kuşgözü/tünel boyu çubuk üstünden ölçülmeli')
    if heading not in ('wave', 'eyelet', 'rod_pocket') and request['drop_datum'] != 'hook_bearing':
        raise ValueError('Bu başlık için gerçek taşıma noktasından ölçü gerekli')
    drop = number(request.get('attachment_to_floor_mm'), 'attachment_to_floor_mm') - number(request.get('floor_gap_mm'), 'floor_gap_mm', True)
    if drop <= 0:
        raise ValueError('Bitmiş boy pozitif olmalı')
    allowances = config['sewing_profiles'].get(request.get('sewing_profile'))
    if allowances is None:
        raise ValueError('sewing_profile seçilmeli')
    width = number(request.get('usable_fabric_width_mm'), 'usable_fabric_width_mm')
    repeat = number(request.get('pattern_repeat_mm'), 'pattern_repeat_mm', True)
    orientation = request.get('orientation')
    # Fractions supplied explicitly from the selected SKU, NOT a generic fibre guess.
    sw = number(request.get('shrink_warp'), 'shrink_warp', True)
    sf = number(request.get('shrink_weft'), 'shrink_weft', True)
    if sw >= 1 or sf >= 1:
        raise ValueError('Çekme oranı [0,1) olmalı')
    if any(not isinstance(request.get(k), str) or not request[k].strip() for k in ('fabric_source', 'shrink_basis')):
        raise ValueError('Kumaş kaynağı ve çekme dayanağı gerekli')
    flat = rail * fullness
    side = Decimal(str(allowances['side_each_mm']))
    join = Decimal(str(allowances['join_each_edge_mm']))
    length_allowance = Decimal(str(allowances['top_mm'] + allowances['bottom_mm']))
    drops = None
    if orientation == 'railroad':
        if request.get('rotatable') is not True:
            raise ValueError('Boydan boya kullanım için döndürülebilir kumaş onayı gerekli')
        if repeat:
            raise ValueError('Döndürülmüş desen eşleşmesi bu hesapta desteklenmiyor')
        cut_drop = Decimal(ceil((drop + length_allowance) / (1 - sf)))
        if cut_drop > width:
            raise ValueError('Boy + pay + çekme kumaş enine sığmıyor')
        metres = (flat + Decimal(panels) * 2 * side) / (1 - sw) / 1000
        strips_per_panel = 1
    elif orientation == 'normal':
        effective_width = width * (1 - sf)
        if effective_width <= 2 * join:
            raise ValueError('Dikiş payları kullanılabilir eni tüketiyor')
        # n*w - 2*(n-1)*join - 2*side >= target flat panel width.
        strips_per_panel = max(1, ceil((flat / panels + 2 * side - 2 * join) / (effective_width - 2 * join)))
        drops = strips_per_panel * panels
        cut_drop = (drop + length_allowance) / (1 - sw)
        if repeat:
            cut_drop = ceil(cut_drop / repeat) * repeat
        cut_drop = Decimal(ceil(cut_drop))
        metres = cut_drop * drops / 1000
    else:
        raise ValueError('orientation: normal veya railroad')
    if heading == 'wave':
        warnings.append('Wave katsayısı tahmindir; glider/pocket, kanca sayısı ve uç dönüşleri Silent Gliss işçilik tablosuyla doğrulanmalı.')
    warnings.append('Simetrik paneller; tam en kesimler ayrılır. Fire yeniden kullanımı, desen faz başlangıcı, astar ve aksesuarlar ayrıca hesaplanır.')
    return dict(kind=kind, rail_width_mm=str(rail), finished_drop_mm=str(drop),
                flat_finished_width_mm=str(flat), panel_count=panels, strips_per_panel=strips_per_panel,
                total_drops=drops, cut_drop_mm=str(ceil(cut_drop)),
                purchase_linear_m=str(Decimal(ceil(metres * 1000)) / 1000),
                production_ready=False, source_ids=list(dict.fromkeys(mount['source_ids'] + allowances['source_ids'] + config['headings'][heading]['source_ids'])),
                fabric_source=request['fabric_source'], warnings=warnings)


def main():
    # Windows pipe encoding can otherwise fail on Turkish result/warning text.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    args = parser.parse_args()
    try:
        result = calculate(json.loads(args.input.read_text(encoding='utf-8')))
    except (ValueError, KeyError, TypeError) as exc:
        parser.exit(2, f'Ölçü/ürün bilgisi gerekli: {exc}\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

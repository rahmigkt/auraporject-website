"""Five explicit, hypothetical measurement scenarios grounded in published profiles."""
import json
from pathlib import Path

base=dict(kind='curtain',unit='mm',geometry='straight',mount='ceiling',
          window_width_mm=1600,window_height_mm=1400,mount_profile='ikea_150',
          heading='double',fullness=2,panel_count=2,drop_datum='hook_bearing',
          floor_gap_mm=10,sewing_profile='mondial',pattern_repeat_mm=0,
          shrink_warp=0,shrink_weft=0,shrink_basis='Senaryo girdisi: kumaş ön işlemden geçirilmiş, kalan çekme sıfır olarak ölçülmüş varsayılır; gerçek siparişte test gerekir.',
          orientation='normal',usable_fabric_width_mm=1400,
          fabric_source='DIRECT-WIDTH: 1400 mm en mevcut; senaryodaki desen/boy/çekme ürün iddiası değildir.')

examples=[
 dict(id='TR-wave',description='1600×1400 mm açıklık; ray 2000; ray altı–zemin 2600. Daybreak 2, 3000 mm en, döndürülmüş. Henüz gerçek ev ölçüsü değil.',
      input=dict(base,country='TR',heading='wave',fullness=2.3,rail_width_mm=2000,attachment_to_floor_mm=2600,
                 drop_datum='wave_track_underside',orientation='railroad',usable_fabric_width_mm=3000,rotatable=True,
                 shrink_warp=0.03,shrink_weft=0.01,shrink_basis='DAYBREAK: yaklaşık warp %3, weft %1; kesim yönü döndürülmüştür.',fabric_source='DAYBREAK'),
      expected=dict(purchase_linear_m='4.908',cut_drop_mm='2920',flat_finished_width_mm='4600.0',panel_count=2,total_drops=None)),
 dict(id='GB-repeat',description='1800 mm ray; bitmiş boy 2200; ön işlemli 1400 mm kumaş; varsayımsal ölçülmüş desen tekrarı 320 mm.',
      input=dict(base,country='GB',heading='pencil',rail_width_mm=1800,attachment_to_floor_mm=2210,pattern_repeat_mm=320),
      expected=dict(purchase_linear_m='10.24',cut_drop_mm='2560',panel_count=2,total_drops=4)),
 dict(id='FR-eyelet',description='2400 mm ray; bitmiş boy 2450; 1.5 dolgunluk seçimi üretici kuralı değil, ön tasarım varsayımı.',
      input=dict(base,country='FR',heading='eyelet',fullness=1.5,rail_width_mm=2400,attachment_to_floor_mm=2470,floor_gap_mm=20,drop_datum='rod_top',mount='rod'),
      expected=dict(purchase_linear_m='11',cut_drop_mm='2750',panel_count=2,total_drops=4)),
 dict(id='CH-triple',description='2200 mm ray; üçlü pile 2.5; bitmiş boy 2300; birleşim payıyla her panel üç tam kumaş eni gerektiriyor.',
      input=dict(base,country='CH',heading='triple',fullness=2.5,rail_width_mm=2200,attachment_to_floor_mm=2315,floor_gap_mm=15,mount_profile='pfister_200'),
      expected=dict(purchase_linear_m='15.6',cut_drop_mm='2600',panel_count=2,total_drops=6)),
 dict(id='DK-recess',description='JYSK profiliyle niş içi: en üst/orta/alt 1200/1194/1198, boy sol/orta/sağ 1500/1498/1502. Kasa/kumaş farkı henüz bilinmiyor.',
      input=dict(country='DK',kind='blind',unit='mm',geometry='straight',mount='recess',blind_profile='jysk_recess_roller',measurement_stage='raw_opening',widths_mm=[1200,1194,1198],heights_mm=[1500,1498,1502]),
      expected=dict(order_width_mm='1184',order_height_mm='1498',cloth_width_mm=None,panel_count=1)),
]
if __name__ == '__main__':
    path=Path(__file__).resolve().parents[2]/'knowledge/ev-projesi/veri/perde-ornekler.json'
    path.write_text(json.dumps(dict(status='hypothetical_measured_design_scenarios_not_customer_projects',examples=examples),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

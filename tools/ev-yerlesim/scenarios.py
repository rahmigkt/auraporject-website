"""Twelve independently authored simulated briefs; no source conversation imports."""
CASES=[
 dict(id='codex-001',country='BE',region='BE-VLG',lang='nl',type='rijwoning',floors=[['living','kitchen','bath'],['bedroom','child','study']],width=5200,scheme='toprak',color='cream',wood='oak',sofa=2100,table=1400,mattress=1600,budget=24000,behavior='unknown_measurements; child; rowhouse',keep='dining'),
 dict(id='codex-002',country='BE',region='BE-BRU',lang='fr',type='duplex',floors=[['living','kitchen','bath'],['bedroom','study']],width=5400,scheme='klasik',color='navy',wood='walnut',sofa=2200,table=1600,mattress=1600,budget=30000,behavior='old_plan_photo; injunction_in_image; duplex'),
 dict(id='codex-003',country='NL',region='NL-NH',lang='nl',type='hoekappartement',floors=[['living','kitchen','bedroom','bath']],width=5200,scheme='iskandinav',color='sage',wood='oak',sofa=2000,table=1200,mattress=1400,budget=14000,behavior='indecisive; keep_sofa; corner_flat',keep='sofa'),
 dict(id='codex-004',country='DE',region='DE-BE',lang='de',type='Altbau',floors=[['living','kitchen','bedroom','study','bath']],width=5600,scheme='klasik',color='anthracite',wood='walnut',sofa=2300,table=1600,mattress=1800,budget=26000,behavior='protected_features; structural_removal_request'),
 dict(id='codex-005',country='FR',region='FR-IDF',lang='fr',type='appartement haussmannien',floors=[['living','kitchen','bedroom','child','bath']],width=5500,scheme='klasik',color='olive',wood='oak',sofa=2200,table=1400,mattress=1600,budget=28000,behavior='T3_conflict; preserve_mouldings; change_mind'),
 dict(id='codex-006',country='GB',region='GB-ENG',lang='en',type='detached house',floors=[['living','kitchen','bedroom','bath'],['child','study']],width=5800,scheme='toprak',color='sand',wood='oak',sofa=2400,table=1600,mattress=1600,budget=35000,behavior='older_parent; feet_and_inches; ground_floor_sleeping',elder=True),
 dict(id='codex-007',country='DK',region='DK-84',lang='da',type='studiolejlighed',floors=[['studio','kitchen','bath']],width=6500,scheme='iskandinav',color='silver',wood='oak',sofa=1800,table=1000,mattress=900,budget=8000,behavior='studio; low_budget; wants_all_items'),
 dict(id='codex-008',country='ES',region='ES-MD',lang='es',type='piso en esquina',floors=[['living','kitchen','bedroom','child','bath']],width=5400,scheme='akdeniz',color='rust',wood='oak',sofa=2100,table=1400,mattress=1500,budget=18000,behavior='child_window_safety; west_glare; rug_change'),
 dict(id='codex-009',country='IT',region='IT-LOM',lang='it',type='trilocale',floors=[['living','kitchen','bedroom','bedroom','bath']],width=5400,scheme='toprak',color='cream',wood='walnut',sofa=2200,table=1600,mattress=1600,budget=22000,behavior='trilocale_count; preserve_table; budget_scope',keep='dining'),
 dict(id='codex-010',country='TR',region='TR-34',lang='tr',type='apartman dairesi',floors=[['living','kitchen','bedroom','bath']],width=5000,scheme='iskandinav',color='cream',wood='oak',sofa=2000,table=1200,mattress=1400,budget=650000,behavior='3plus1_60m2_conflict; revise_program'),
 dict(id='codex-011',country='NL',region='NL-UT',lang='nl',type='maisonnette',floors=[['living','kitchen','bath'],['bedroom','child']],width=5400,scheme='modern',color='navy',wood='walnut',sofa=2100,table=1400,mattress=1600,budget=17000,behavior='moves_home_office; no_stair_measurements; changed_budget'),
 dict(id='codex-012',country='TR',region='TR-35',lang='tr',type='müstakil tek kat ev',floors=[['living','kitchen','bedroom','study','bath']],width=5700,scheme='akdeniz',color='sage',wood='oak',sofa=2300,table=1600,mattress=1800,budget=950000,behavior='garden_door; preserve_bed; visual_promise_pressure',keep='bed')
]
HEIGHTS={'living':5200,'kitchen':5000,'bedroom':4600,'child':4800,'study':3800,'bath':3200,'studio':7000}
ROOM_NAMES={
 'nl':dict(living='Woonkamer',kitchen='Keuken',bedroom='Slaapkamer',child='Kinderkamer',study='Werkkamer',bath='Badkamer',studio='Woon- en slaapruimte',hall='Hal'),
 'fr':dict(living='Séjour',kitchen='Cuisine',bedroom='Chambre',child='Chambre enfant',study='Bureau',bath='Salle de bains',studio='Studio',hall='Entrée'),
 'de':dict(living='Wohnzimmer',kitchen='Küche',bedroom='Schlafzimmer',child='Kinderzimmer',study='Arbeitszimmer',bath='Bad',studio='Studio',hall='Flur'),
 'en':dict(living='Living room',kitchen='Kitchen',bedroom='Bedroom',child='Child room',study='Study',bath='Bathroom',studio='Studio',hall='Hall'),
 'da':dict(living='Stue',kitchen='Køkken',bedroom='Soveværelse',child='Børneværelse',study='Arbejdsværelse',bath='Badeværelse',studio='Studio',hall='Entré'),
 'es':dict(living='Salón',kitchen='Cocina',bedroom='Dormitorio',child='Cuarto infantil',study='Estudio',bath='Baño',studio='Estudio',hall='Pasillo'),
 'it':dict(living='Soggiorno',kitchen='Cucina',bedroom='Camera',child='Camera bambini',study='Studio',bath='Bagno',studio='Monolocale',hall='Ingresso'),
 'tr':dict(living='Salon',kitchen='Mutfak',bedroom='Yatak odası',child='Çocuk odası',study='Çalışma',bath='Banyo',studio='Yaşam ve uyku',hall='Hol')}

def products(case,kind,space):
    roles={'living':['sofa','tv'],'studio':['sofa','tv','bed'],'kitchen':['kitchen','dining'],'bedroom':['bed','wardrobe'],'child':['bed','desk','wardrobe'],'study':['desk','bookcase'],'bath':['basin']}.get(kind,[])
    out=[]
    for role in roles:
        family,variant={'sofa':('seating','sofa'),'tv':('storage','tvunit'),'dining':('table','dining'),'bed':('bedroom','bed'),'wardrobe':('storage','wardrobe'),'desk':('table','desk'),'bookcase':('storage','bookcase'),'kitchen':('kitchen','run'),'basin':('bath','basin')}[role]
        params={'sofa':dict(width=case['sofa'],depth=850,seatCount=2,armType='square',backType='loose',baseType='legs'),
                'tv':dict(width=1200,depth=350,height=500),
                'dining':dict(length=case['table'],width=800,height=750,topShape='rect',baseType='legsApron',leaves=0),
                'bed':dict(mattressWidth=900 if kind=='child' else case['mattress'],mattressLength=2000,border=40,headThickness=80,headExtend=0,headType='upholstered',headShape='rounded',integratedNight='none',footboard='none'),
                'wardrobe':dict(width=1200,depth=580,height=2100),
                'desk':dict(length=1000 if kind=='child' else 1200,width=600,height=740,topShape='rect',baseType='legsApron'),
                'bookcase':dict(width=900,depth=300,height=1800),
                'kitchen':dict(modules=[dict(type='sink',w=800,wall='none'),dict(type='drawers',w=600,wall='none'),dict(type='hob',w=600,wall='hood'),dict(type='doors',w=400,wall='none')]),
                'basin':dict(width=800,depth=500,height=850)}[role]
        materials=dict(fabric=dict(fiber='linen',color=case['color'],weave='plain',pattern='none'),wood=dict(species='gurgen',stain=case['wood'],finish='matte'))
        if family=='table':materials=dict(top=dict(surface='wood',species=case['wood'],finish='matte'),base=dict(surface='wood',species=case['wood'],finish='matte'))
        out.append(dict(id=space+'-'+role,role=role,space_id=space,origin='existing' if case.get('keep')==role else 'proposed',design=dict(family=family,kind=variant,style='japandi',seed=1,params=params,materials=materials)))
    return out

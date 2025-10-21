/**
 * 在宅医療費用シミュレーター
 * 特定医療法人 新生病院
 */

class MedicalFeeCalculator {
    constructor() {

        this.form = document.getElementById('simulationForm');
        this.resultSection = document.getElementById('resultSection');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.totalAmountDisplay = document.getElementById('totalAmount')?.querySelector('span');
        this.breakdownContainer = document.getElementById('breakdown');
        this.comparisonSection = document.getElementById('comparisonSection');
        this.comparisonTable = document.getElementById('comparisonTable');
        

        

        

        
        // プラン比較用のデータストレージ
        this.comparisonPlans = [];
        this.planCounter = 0;
        this.comparisonEnabled = false;
        
        // 2024年度診療報酬改定正確な点数（点数×10円）
        this.medicalFees = {
            // 1. 在宅時医学総合管理料（月額）- 2024年度訪問回数・重症度別
            在総管: {
                '在総管1': {
                    monthly_1: 27450,      // 月1回: 2,745点 × 10円
                    monthly_2_normal: 44850, // 月2回以上（重症度なし）: 4,485点
                    monthly_2_severe: 53850, // 月2回以上（重症度あり）: 5,385点
                    description: '在宅時医学総合管理料（同一日に訪問する患者が1人）'
                },
                '在総管2-9': {
                    monthly_1: 14850,      // 月1回: 1,485点 × 10円
                    monthly_2_normal: 23850, // 月2回以上（重症度なし）: 2,385点
                    monthly_2_severe: 44850, // 月2回以上（重症度あり）: 4,485点
                    description: '在宅時医学総合管理料（同一日に訪問する患者が2-9人）'
                },
                '在総管10-19': {
                    monthly_1: 7650,       // 月1回: 765点 × 10円
                    monthly_2_normal: 11850, // 月2回以上（重症度なし）: 1,185点
                    monthly_2_severe: 28650, // 月2回以上（重症度あり）: 2,865点
                    description: '在宅時医学総合管理料（同一日に訪問する患者が10-19人）'
                }
            },
            // 施設入居時等医学総合管理料（月額）- 2024年度訪問回数・重症度別
            施設総管: {
                '施設総管1': {
                    monthly_1: 19650,      // 月1回: 1,965点 × 10円
                    normal: 31850,         // 月2回以上（重症度なし）: 3,185点
                    severe: 38850,         // 月2回以上（重症度あり）: 3,885点
                    description: '施設入居時等医学総合管理料（同一日に訪問する患者が1人）'
                },
                '施設総管2-9': {
                    monthly_1: 10650,      // 月1回: 1,065点 × 10円
                    normal: 16850,         // 月2回以上（重症度なし）: 1,685点
                    severe: 32250,         // 月2回以上（重症度あり）: 3,225点
                    description: '施設入居時等医学総合管理料（同一日に訪問する患者が2-9人）'
                },
                '施設総管10-19': {
                    monthly_1: 7650,       // 月1回: 765点 × 10円
                    normal: 11850,         // 月2回以上（重症度なし）: 1,185点
                    severe: 28650,         // 月2回以上（重症度あり）: 2,865点
                    description: '施設入居時等医学総合管理料（同一日に訪問する患者が10-19人）'
                }
            },
            // 在宅がん医療総合診療料（日額）
            '在宅がん医療総合診療料': {
                with_prescription: 17980,    // 1,798点 × 10円（処方せん交付あり）
                without_prescription: 20000, // 2,000点 × 10円（処方せん交付なし）
                description: '在宅がん医療総合診療料'
            }
        };
        
        // 訪問看護料金体系（2024年度・添付資料準拠）
        this.nursingCareFees = {
            // 基本療養費（患者タイプ別・看護タイプ別・時間別）
            basicFee: {
                '在宅がん医療総合診療料': {
                    '看護のみ': {
                        '20分未満': 3140,     // 314点 × 10円
                        '30分未満': 4710,     // 471点 × 10円
                        '1時間未満': 8230,    // 823点 × 10円
                        '1時間以上': 11280    // 1,128点 × 10円
                    },
                    '看護+セラピスト': {
                        '20分未満': 2940,     // 294点 × 10円
                        '30分未満': 5880,     // 588点 × 10円
                        '1時間未満': 7940,    // 794点 × 10円
                        '1時間以上': 10800    // 1,080点 × 10円
                    }
                },
                '介護保険（要介護）': {
                    '看護のみ': {
                        '20分未満': 3140,     // 訪看I1: 314点 × 10円
                        '30分未満': 4710,     // 訪看I2: 471点 × 10円
                        '1時間未満': 8230,    // 訪看I3: 823点 × 10円
                        '1時間以上': 11280    // 訪看I4: 1,128点 × 10円
                    },
                    '看護+セラピスト': {
                        '20分未満': 2940,     // 訪看I5: 294点 × 10円（20分）
                        '30分未満': 5880,     // 訪看I5: 588点 × 10円（40分）
                        '1時間未満': 7940,    // 訪看I5: 794点 × 10円（60分）
                        '1時間以上': 7940     // 訪看I5: 794点 × 10円（60分）
                    }
                },
                '介護保険（要支援）': {
                    '看護のみ': {
                        '20分未満': 3030,     // 訪看I1: 303点 × 10円
                        '30分未満': 4510,     // 訪看I2: 451点 × 10円
                        '1時間未満': 7940,    // 訪看I3: 794点 × 10円
                        '1時間以上': 10900    // 訪看I4: 1,090点 × 10円
                    },
                    '看護+セラピスト': {
                        '20分未満': 3030,     // 訪看I5: 303点 × 10円（20分）
                        '30分未満': 6060,     // 訪看I5: 606点 × 10円（40分）
                        '1時間未満': 4550,    // 訪看I5: 455点 × 10円（60分）
                        '1時間以上': 4550     // 訪看I5: 455点 × 10円（60分）
                    }
                },
                '医療保険': {
                    '看護のみ': {
                        '20分未満': 5550,     // 555点 × 10円  
                        '30分未満': 5550,     // 555点 × 10円（3日目以降は555点）
                        '1時間未満': 5550,    // 555点 × 10円
                        '1時間以上': 5550     // 555点 × 10円
                    }
                }
            },
            
            // 週の訪問回数制限
            weeklyLimits: {
                '在宅がん医療総合診療料': 4,      // 週1回から週4回
                '介護保険（要介護）': 4,  // 週1回から週4回
                '介護保険（要支援）': 4,  // 週1回から週4回
                '医療保険': 1      // 週1日まで
            },

            // 介護保険の加算
            careInsuranceAdditions: {
                'なし': 0,
                '緊急-6000': 6000,
                '特別管理加算I-5000': 5000,
                '特別管理加算II-2500': 2500,
                '専門管理加算-2500': 2500,
                '複数名加算I2-2540': 2540,
                '複数名加算I3I4-4020': 4020,
                'オンライン資格確認-50': 50
            },

            // 医療保険の加算
            medicalInsuranceAdditions: {
                'なし': 0,
                '管理療養費初回-7670': 7670,  // 月初め1回（2回目以降2500円）
                '24時間対応加算-6800': 6800,
                '特別管理加算I-2500': 2500,
                '特別管理加算II-5000': 5000,
                '専門管理加算ロ-2500': 2500,
                'オンライン資格確認-50': 50
            },

            // 医療保険検査当額
            medicalInsuranceExam: {
                'なし': 0,
                '50': 50  // オンライン資格確認加算
            }
        };
        
        // 2. 在宅患者訪問診療料（日額）
        this.visitFees = {
            single: 8880,     // 888点（同一日に1人のみ訪問）
            multiple: 2030    // 203点（同一日に2人以上訪問）
        };
        
        // 3. 介護保険（居宅療養管理指導）- 訪問患者数別料金表（2024年度正確単位）
        this.nursingFees = {
            // 医師による居宅療養管理指導
            doctor: {
                // 在宅がん医療総合診療料算定時
                '在宅がん医療総合診療料': {
                    '1名': 5150,        // Ⅰ1: 515単位 × 10円（1人）
                    '2-9名': 4870,      // Ⅰ2: 487単位 × 10円（2-9人）
                    '10名以上': 4460    // Ⅰ3: 446単位 × 10円（10人以上）
                },
                // それ以外（在総管・施設総管算定時）
                'その他': {
                    '1名': 2990,        // Ⅱ1: 299単位 × 10円（1人）
                    '2-9名': 2870,      // Ⅱ2: 287単位 × 10円（2-9人）
                    '10名以上': 2600    // Ⅱ3: 260単位 × 10円（10人以上）
                }
            },
            // 薬剤師による居宅療養管理指導
            pharmacist: 4030           // 薬剤師: 403単位
        };

        // 交通費（自費・距離別料金表）
        this.distanceFees = [
            { min: 0, max: 4, fee: 0 },      // 4km未満: なし
            { min: 4, max: 6, fee: 509 },    // 4-6km: 509円
            { min: 6, max: 8, fee: 1019 },   // 6-8km: 1,019円
            { min: 8, max: Infinity, fee: 1528 }  // 8km以上: 1,528円
        ];

        this.initializeEventListeners();
    }

    initializeEventListeners() {

        if (!this.form) {
            console.error('フォーム要素が見つかりません');
            return;
        }
        

        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.form.addEventListener('reset', this.handleFormReset.bind(this));
        
        // 計算ボタンに直接clickイベントを追加（フォールバック）
        const calculateButton = this.form.querySelector('button[type="submit"]');
        if (calculateButton) {

            calculateButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleFormSubmit(event);
            });
        } else {
            console.error('Calculate button not found');
        }
        

        
        // 印刷ボタンのイベントリスナー
        const printButton = document.getElementById('printButton');
        if (printButton) {
            printButton.addEventListener('click', this.handlePrint.bind(this));
        }
        
        // 比較機能のイベントリスナー
        const enableComparisonButton = document.getElementById('enableComparisonButton');
        if (enableComparisonButton) {
            enableComparisonButton.addEventListener('click', this.handleComparisonToggle.bind(this));
        }
        
        const addPlanButton = document.getElementById('addPlanButton');
        if (addPlanButton) {
            addPlanButton.addEventListener('click', this.handleAddPlan.bind(this));
        }
        
        const showComparisonButton = document.getElementById('showComparisonButton');
        if (showComparisonButton) {
            showComparisonButton.addEventListener('click', this.handleShowComparison.bind(this));
        }
        
        const clearComparisonButton = document.getElementById('clearComparisonButton');
        if (clearComparisonButton) {
            clearComparisonButton.addEventListener('click', this.handleClearComparison.bind(this));
        }
        
        const printComparisonButton = document.getElementById('printComparisonButton');
        if (printComparisonButton) {
            printComparisonButton.addEventListener('click', this.handlePrintComparison.bind(this));
        }
        
        // サービス無効化チェックボックス
        const disableHomeMedical = document.getElementById('disableHomeMedical');
        if (disableHomeMedical) {
            disableHomeMedical.addEventListener('change', this.handleServiceDisable.bind(this));
        }
        
        const disableHomeNursing = document.getElementById('disableHomeNursing');
        if (disableHomeNursing) {
            disableHomeNursing.addEventListener('change', this.handleServiceDisable.bind(this));
        }
        
        // サービスタブのイベントリスナー
        this.initializeServiceTabs();
        
        // 訪問看護の患者タイプ変更時の加算項目表示制御
        const nursingPatientTypeSelect = document.getElementById('nursingPatientType');
        if (nursingPatientTypeSelect) {
            nursingPatientTypeSelect.addEventListener('change', this.handleNursingPatientTypeChange.bind(this));
            // 初期状態で基本フィールドを表示
            this.handleNursingPatientTypeChange({ target: nursingPatientTypeSelect });
        }
        
        // 患者タイプ変更時の表示制御と連動機能
        const patientTypeSelect = document.getElementById('patientType');
        const prescriptionGroup = document.getElementById('prescriptionGroup');
        const prescriptionSelect = document.getElementById('prescription');
        const severityGroup = document.getElementById('severity')?.closest('.form-group');
        const severitySelect = document.getElementById('severity');
        
        if (patientTypeSelect) {
            patientTypeSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            
            // 在宅がん医療総合診療料選択時の自動連動
            if (selectedValue === '在宅がん医療総合診療料') {
                const nursingPatientTypeSelect = document.getElementById('nursingPatientType');
                if (nursingPatientTypeSelect) {
                    nursingPatientTypeSelect.value = '在宅がん医療総合診療料';
                    // 訪問看護患者タイプ変更イベントをトリガー
                    nursingPatientTypeSelect.dispatchEvent(new Event('change'));
                }
            }
            
            if (e.target.value === '在宅がん医療総合診療料') {
                // 処方せん交付を表示
                if (prescriptionGroup) {
                    prescriptionGroup.style.display = 'block';
                }
                if (prescriptionSelect) {
                    prescriptionSelect.required = true;
                }
                
                // 重症度選択を非表示
                if (severityGroup) {
                    severityGroup.style.display = 'none';
                }
                if (severitySelect) {
                    severitySelect.required = false;
                    severitySelect.value = '重症度なし'; // デフォルト値を設定
                }
                
                // 月間訪問日数を4日に自動設定
                const monthlyVisitsSelect = document.getElementById('monthlyVisits');
                if (monthlyVisitsSelect) {
                    monthlyVisitsSelect.value = '4';
                }
            } else {
                // 処方せん交付を非表示
                if (prescriptionGroup) {
                    prescriptionGroup.style.display = 'none';
                }
                if (prescriptionSelect) {
                    prescriptionSelect.required = false;
                    prescriptionSelect.value = '';
                }
                
                // 重症度選択を表示
                if (severityGroup) {
                    severityGroup.style.display = 'block';
                }
                if (severitySelect) {
                    severitySelect.required = true;
                    severitySelect.value = '';
                }
            }
        });
        }
    }

    handleFormSubmit(event) {
        console.log('Form submit event triggered!');
        event.preventDefault();
        
        console.log('Starting validation...');
        if (!this.validateForm()) {
            console.log('Validation failed');
            return;
        }
        console.log('Validation passed, proceeding with calculation...');
        
        if (!this.loadingSpinner) {
            console.error('Loading spinner not found');
            return;
        }
        
        this.showLoading(true);
        
        // 非同期処理をシミュレート
        setTimeout(() => {
            try {
                const formData = this.getFormData();
                const calculationResult = this.calculateFee(formData);
                this.displayResult(calculationResult);
                this.saveSimulationResult(formData, calculationResult);
                
                // 結果セクションにスクロール
                this.resultSection.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error('計算エラー:', error);
                this.showError('計算中にエラーが発生しました。');
            } finally {
                this.showLoading(false);
            }
        }, 1000);
    }

    handleFormReset() {
        this.resultSection.style.display = 'none';
        this.scrollToTop();
    }

    handleServiceDisable(event) {
        const checkbox = event.target;
        const isHomeMedical = checkbox.id === 'disableHomeMedical';
        
        // より具体的なセレクターを使用してチェックボックスを除外
        const sectionClass = isHomeMedical ? '.home-medical-section' : '.home-nursing-section';
        const sections = document.querySelectorAll(sectionClass);
        
        sections.forEach(section => {
            // セクション区切りは除外（チェックボックスが含まれている部分）
            if (section.classList.contains('section-divider')) return;
            
            if (checkbox.checked) {
                section.classList.add('disabled');
                // フォーム要素のみを対象にして、チェックボックスは除外
                const formElements = section.querySelectorAll('input[type="text"], input[type="number"], select');
                formElements.forEach(input => {
                    input.disabled = true;
                    if (input.hasAttribute('required')) {
                        input.removeAttribute('required');
                        input.dataset.wasRequired = 'true';
                    }
                });
            } else {
                section.classList.remove('disabled');
                // フォーム要素を復活
                const formElements = section.querySelectorAll('input[type="text"], input[type="number"], select');
                formElements.forEach(input => {
                    input.disabled = false;
                    if (input.dataset.wasRequired === 'true') {
                        input.setAttribute('required', '');
                        delete input.dataset.wasRequired;
                    }
                });
            }
        });
        
        // 結果セクションを隠す
        this.resultSection.style.display = 'none';
        this.comparisonSection.style.display = 'none';
    }

    hideCareInsuranceOnlineAddition() {
        // 介護保険の医療DX（オンライン資格確認）加算項目を非表示
        const onlineAdditionLabel = document.querySelector('label:has(input[name="careInsuranceAddition"][value="オンライン資格確認-50"])');
        if (onlineAdditionLabel) {
            onlineAdditionLabel.style.display = 'none';
            // チェックも外す
            const checkbox = onlineAdditionLabel.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        }
    }

    showCareInsuranceOnlineAddition() {
        // 介護保険の医療DX（オンライン資格確認）加算項目を表示
        const onlineAdditionLabel = document.querySelector('label:has(input[name="careInsuranceAddition"][value="オンライン資格確認-50"])');
        if (onlineAdditionLabel) {
            onlineAdditionLabel.style.display = 'flex';
        }
    }

    updateNursingVisitsLabel(labelText) {
        // 週訪問回数フィールドのラベルを動的に変更
        const weeklyNursingVisitsLabel = document.querySelector('label[for="weeklyNursingVisits"]');
        if (weeklyNursingVisitsLabel) {
            weeklyNursingVisitsLabel.innerHTML = `${labelText} <span class="required">*</span>`;
        }
        
        // 注釈も対応して変更 - 直接IDで要素を取得
        const weeklyNursingVisitsNote = document.getElementById('weeklyNursingVisitsNote');
        if (weeklyNursingVisitsNote) {
            if (labelText.includes('看護・リハ')) {
                weeklyNursingVisitsNote.textContent = '※看護・リハの訪問頻度を選択';
            } else {
                weeklyNursingVisitsNote.textContent = '※看護の訪問頻度を選択';
            }
        }
    }

    handleNursingPatientTypeChange(event) {
        const nursingPatientType = event.target.value;
        
        // 在宅がん医療総合診療料選択時の自動連動
        const patientTypeSelect = document.getElementById('patientType');
        if (nursingPatientType === '在宅がん医療総合診療料' && patientTypeSelect.value !== '在宅がん医療総合診療料') {
            patientTypeSelect.value = '在宅がん医療総合診療料';
            // 訪問診療患者タイプ変更イベントをトリガー
            patientTypeSelect.dispatchEvent(new Event('change'));
        }
        
        // 要素を取得
        const nursingDuration = document.getElementById('nursingDuration')?.closest('.form-group');
        const weeklyNursingVisits = document.getElementById('weeklyNursingVisits');
        const rehabDuration = document.getElementById('rehabDuration')?.closest('.form-group');
        const weeklyRehabVisits = document.getElementById('weeklyRehabVisits');
        const careInsuranceAdditions = document.getElementById('careInsuranceAdditions');
        const medicalInsuranceAdditions = document.getElementById('medicalInsuranceAdditions');
        const sundayRegularVisit = document.getElementById('sundayRegularVisit');
        
        // すべての項目を一旦非表示
        const allElements = [
            nursingDuration, weeklyNursingVisits, rehabDuration, weeklyRehabVisits,
            careInsuranceAdditions, medicalInsuranceAdditions, sundayRegularVisit
        ];
        
        allElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // 患者タイプが未選択の場合、基本的な訪問看護フィールドをデフォルト表示
        if (nursingPatientType === '') {
            // 基本的なフィールドのみ表示（ユーザーが患者タイプを選択するまで）
            if (nursingDuration) nursingDuration.style.display = 'flex';
            if (weeklyNursingVisits) weeklyNursingVisits.style.display = 'flex';
            if (rehabDuration) rehabDuration.style.display = 'flex';
            if (weeklyRehabVisits) weeklyRehabVisits.style.display = 'flex';
            if (sundayRegularVisit) sundayRegularVisit.style.display = 'flex';
            
            // 未選択時は医療DX加筗を表示
            this.showCareInsuranceOnlineAddition();
            
            // 未選択時は元のラベルに戻す
            this.updateNursingVisitsLabel('（看護）週の訪問回数');
        }
        
        // 患者タイプに応じた表示制御
        if (nursingPatientType === '在宅がん医療総合診療料') {
            // 在がんの場合：自費部分のみ表示（交通費なし）
            if (sundayRegularVisit) sundayRegularVisit.style.display = 'flex';
            
            // 在がんは医療保険扱いなので医療DX加算を表示
            this.showCareInsuranceOnlineAddition();
            
            // 在がん選択時は元のラベルに戻す
            this.updateNursingVisitsLabel('（看護）週の訪問回数');
            
        } else if (nursingPatientType === '介護保険（要介護）') {
            // 介護保険（要介護）の場合：医療DX加算を除いて表示
            if (nursingDuration) nursingDuration.style.display = 'flex';
            if (weeklyNursingVisits) weeklyNursingVisits.style.display = 'flex';
            if (rehabDuration) rehabDuration.style.display = 'flex';
            if (weeklyRehabVisits) weeklyRehabVisits.style.display = 'flex';
            if (careInsuranceAdditions) careInsuranceAdditions.style.display = 'flex';
            if (sundayRegularVisit) sundayRegularVisit.style.display = 'flex';
            
            // 介護保険の場合は医療DX（オンライン資格確認）加算を非表示
            this.hideCareInsuranceOnlineAddition();
            
            // 介護保険選択時は元のラベルに戻す
            this.updateNursingVisitsLabel('（看護）週の訪問回数');
            
        } else if (nursingPatientType === '介護保険（要支援）') {
            // 介護保険（要支援）の場合：医療DX加算を除いて表示
            if (nursingDuration) nursingDuration.style.display = 'flex';
            if (weeklyNursingVisits) weeklyNursingVisits.style.display = 'flex';
            if (rehabDuration) rehabDuration.style.display = 'flex';
            if (weeklyRehabVisits) weeklyRehabVisits.style.display = 'flex';
            if (careInsuranceAdditions) careInsuranceAdditions.style.display = 'flex';
            if (sundayRegularVisit) sundayRegularVisit.style.display = 'flex';
            
            // 介護保険の場合は医療DX（オンライン資格確認）加筗を非表示
            this.hideCareInsuranceOnlineAddition();
            
            // 介護保険選択時は元のラベルに戻す
            this.updateNursingVisitsLabel('（看護）週の訪問回数');
            
        } else if (nursingPatientType === '医療保険') {
            // 医療保険の場合：看護・リハビリの分離概念がないため、週訪問回数のみ表示
            if (weeklyNursingVisits) weeklyNursingVisits.style.display = 'flex';
            if (medicalInsuranceAdditions) medicalInsuranceAdditions.style.display = 'flex';
            if (sundayRegularVisit) sundayRegularVisit.style.display = 'flex';
            // リハビリ関連フィールドは非表示（医療保険では看護・リハ区別なし）
            
            // 医療保険の場合は医療DX加算を表示
            this.showCareInsuranceOnlineAddition();
            
            // 医療保険選択時はラベルを「（看護・リハ）週の訪問回数」に変更
            this.updateNursingVisitsLabel('（看護・リハ）週の訪問回数');
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        
        // サービス無効化チェック
        const disableHomeMedical = formData.has('disableHomeMedical');
        const disableHomeNursing = formData.has('disableHomeNursing');
        
        // サービスタイプを動的に決定
        let serviceType = 'both';
        if (disableHomeMedical && disableHomeNursing) {
            serviceType = 'none'; // 両方無効の場合
        } else if (disableHomeMedical) {
            serviceType = 'home-nursing';
        } else if (disableHomeNursing) {
            serviceType = 'home-medical';
        }
        
        return {
            // サービス選択
            serviceType: serviceType,
            disableHomeMedical: disableHomeMedical,
            disableHomeNursing: disableHomeNursing,
            
            // 訪問診療関連
            patientType: formData.get('patientType') || '',
            insuranceRate: parseInt(formData.get('insuranceRate')) || 30, // デフォルト3割負担
            nursingRate: parseInt(formData.get('nursingRate')) || 10, // デフォルト1割負担
            incomeLevel: formData.get('incomeLevel') || '',
            distance: parseFloat(formData.get('distance')) || 0,
            nursingService: formData.get('nursingService') || '',
            prescription: formData.get('prescription') || '',
            monthlyVisits: parseInt(formData.get('monthlyVisits')) || 0,
            severity: formData.get('severity') || '',
            
            // 訪問看護関連
            nursingPatientType: formData.get('nursingPatientType') || '',
            nursingDuration: formData.get('nursingDuration') || '',
            weeklyNursingVisits: parseInt(formData.get('weeklyNursingVisits')) || 0,
            rehabDuration: formData.get('rehabDuration') || '',
            weeklyRehabVisits: parseInt(formData.get('weeklyRehabVisits')) || 0,
            careInsuranceAdditions: formData.getAll('careInsuranceAddition') || [],
            medicalInsuranceAdditions: formData.getAll('medicalInsuranceAddition') || [],
            sundayRegularVisitTime: parseInt(formData.get('sundayRegularVisitTime')) || 0,
            
            // 特別条件
            welfareSubsidy: formData.has('welfareSubsidy'),
            rareDisease: formData.has('rareDisease')
        };
    }

    calculateFee(data) {
        // サービスタイプに応じてカテゴリを設定
        let categories = {};
        
        // 訪問診療が有効な場合
        if (!data.disableHomeMedical && (data.serviceType === 'home-medical' || data.serviceType === 'both')) {
            categories = {
                ...categories,
                medical: { name: '1. 在総管と加算', items: [], subtotal: 0 },
                visit: { name: '2. 在宅患者訪問診療料と加算', items: [], subtotal: 0 },
                nursing: { name: '3. 介護保険（居宅療養管理指導）', items: [], subtotal: 0 },
                transport: { name: '4. 自費（交通費）', items: [], subtotal: 0 }
            };
        } else if (data.disableHomeMedical) {
            // 訪問診療が無効な場合、0円カテゴリを作成
            categories = {
                ...categories,
                medical: { name: '1. 在総管と加算', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                visit: { name: '2. 在宅患者訪問診療料と加算', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                nursing: { name: '3. 介護保険（居宅療養管理指導）', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                transport: { name: '4. 自費（交通費）', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 }
            };
        }
        
        // 訪問看護が有効な場合
        if (!data.disableHomeNursing && (data.serviceType === 'home-nursing' || data.serviceType === 'both')) {
            categories = {
                ...categories,
                nursingBasic: { name: '1. 訪問看護基本療養費', items: [], subtotal: 0 },
                nursingManagement: { name: '2. 訪問看護管理療養費', items: [], subtotal: 0 },
                nursingAddition: { name: '3. 訪問看護加算', items: [], subtotal: 0 },
                nursingTransport: { name: '4. 訪問看護交通費', items: [], subtotal: 0 }
            };
        } else if (data.disableHomeNursing) {
            // 訪問看護が無効な場合、0円カテゴリを作成
            categories = {
                ...categories,
                nursingBasic: { name: '1. 訪問看護基本療養費', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                nursingManagement: { name: '2. 訪問看護管理療養費', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                nursingAddition: { name: '3. 訪問看護加算', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 },
                nursingTransport: { name: '4. 訪問看護交通費', items: [{ name: '利用しません', detail: '¥0', amount: 0 }], subtotal: 0 }
            };
        }
        
        let calculation = {
            categories: categories,
            totalAfterInsurance: 0,
            serviceType: data.serviceType,
            patientType: data.patientType,
            severity: data.severity
        };

        // 訪問診療の計算（無効でない場合のみ）
        if (!data.disableHomeMedical && (data.serviceType === 'home-medical' || data.serviceType === 'both')) {
            this.calculateHomeMedicalFees(data, calculation);
        }
        
        // 訪問看護の計算（無効でない場合のみ）
        if (!data.disableHomeNursing && (data.serviceType === 'home-nursing' || data.serviceType === 'both')) {
            this.calculateHomeNursingFees(data, calculation);
        }

        // 合算計算
        this.calculateTotalFees(data, calculation);
        
        // デバッグ出力を削除して結果を返す
        return calculation;
    }

    calculateHomeMedicalFees(data, calculation) {
        // 1. 在総管または在がんの計算
        if (data.patientType === '在宅がん医療総合診療料') {
            // 処方せん交付の有無で料金が変わる（1日あたり×30日で算定）
            const dailyFee = data.prescription === 'あり' ? 
                this.medicalFees['在宅がん医療総合診療料'].with_prescription : 
                this.medicalFees['在宅がん医療総合診療料'].without_prescription;
            const totalFee = dailyFee * 30; // 月30日固定
            
            calculation.categories.medical.items.push({
                name: '在宅がん医療総合診療料',
                detail: `${dailyFee}円 × 30日（処方せん交付${data.prescription}）`,
                amount: totalFee
            });
            calculation.categories.medical.subtotal = totalFee;
        } else if (data.patientType.includes('在総管') || data.patientType.includes('施設総管')) {
            const category = data.patientType.includes('在総管') ? '在総管' : '施設総管';
            const feeInfo = this.medicalFees[category][data.patientType];
            
            if (!feeInfo) {
                throw new Error(`料金情報が見つかりません: ${data.patientType}`);
            }
            
            let fee, feeDetail;
            
            if (category === '在総管') {
                // 在総管は訪問回数と重症度で料金が変わる
                if (data.monthlyVisits === 1) {
                    fee = feeInfo.monthly_1;
                    feeDetail = '月1回';
                } else {
                    // 月2回以上
                    if (data.severity === '重症度あり') {
                        fee = feeInfo.monthly_2_severe;
                        feeDetail = '月2回以上（重症度あり）';
                    } else {
                        fee = feeInfo.monthly_2_normal;
                        feeDetail = '月2回以上（重症度なし）';
                    }
                }
            } else {
                // 施設総管も訪問回数と重症度で判定
                if (data.monthlyVisits === 1) {
                    fee = feeInfo.monthly_1;
                    feeDetail = '月1回';
                } else {
                    // 月2回以上は重症度で判定
                    if (data.severity === '重症度あり') {
                        fee = feeInfo.severe;
                        feeDetail = '月2回以上（重症度あり）';
                    } else {
                        fee = feeInfo.normal;
                        feeDetail = '月2回以上（重症度なし）';
                    }
                }
            }
            
            calculation.categories.medical.items.push({
                name: feeInfo.description,
                detail: feeDetail,
                amount: fee
            });
            calculation.categories.medical.subtotal = fee;
        }

        // 2. 在宅患者訪問診療料の計算
        if (data.patientType !== '在宅がん医療総合診療料') {
            const isMultiplePatients = data.patientType.includes('2-9') || data.patientType.includes('10-19');
            const visitFeePerDay = isMultiplePatients ? this.visitFees.multiple : this.visitFees.single;
            const totalVisitFee = visitFeePerDay * data.monthlyVisits;
            
            calculation.categories.visit.items.push({
                name: '在宅患者訪問診療料',
                detail: `${visitFeePerDay}円 × ${data.monthlyVisits}日`,
                amount: totalVisitFee
            });
            
            // 同日複数患者訪問加算
            if (isMultiplePatients) {
                calculation.categories.visit.items.push({
                    name: '同日複数患者訪問加算',
                    detail: '適用済み',
                    amount: 0
                });
            }
            
            calculation.categories.visit.subtotal = totalVisitFee;
        }

        // 3. 介護保険（居宅療養管理指導）
        // 介護保険サービス利用者には算定
        const isNursingServiceUser = this.isNursingInsuranceApplicable(data);
        
        if (isNursingServiceUser) {
            // 患者タイプから訪問患者数を判定
            let patientCount = '1名';
            if (data.patientType.includes('2-9') || data.patientType.includes('施設総管2-9')) {
                patientCount = '2-9名';
            } else if (data.patientType.includes('10-19') || data.patientType.includes('施設総管10-19')) {
                patientCount = '10名以上';
            }
            
            // 患者タイプに応じた料金区分を決定
            const feeCategory = data.patientType === '在宅がん医療総合診療料' ? '在宅がん医療総合診療料' : 'その他';
            const nursingFeePerVisit = this.nursingFees.doctor[feeCategory][patientCount];
            
            // 居宅療養管理指導は月2回まで算定可能
            const nursingVisits = Math.min(data.monthlyVisits, 2);
            const totalNursingFee = nursingFeePerVisit * nursingVisits;
            
            // 料金区分の表示名
            const categoryDisplayName = feeCategory === '在宅がん医療総合診療料' ? 'Ⅰ' : 'Ⅱ';
            const patientNumSuffix = patientCount === '1名' ? '1' : (patientCount === '2-9名' ? '2' : '3');
            
            calculation.categories.nursing.items.push({
                name: `居宅療養管理指導（医師）`,
                detail: `${nursingFeePerVisit}円 × ${nursingVisits}回（${categoryDisplayName}${patientNumSuffix}・${patientCount}）`,
                amount: totalNursingFee
            });
            
            calculation.categories.nursing.subtotal = totalNursingFee;
        }

        // 4. 自費（交通費）
        const distanceFee = this.calculateDistanceFee(data.distance);
        if (distanceFee > 0) {
            const totalDistanceFee = distanceFee * data.monthlyVisits;
            
            calculation.categories.transport.items.push({
                name: '交通費',
                detail: `${distanceFee}円 × ${data.monthlyVisits}日`,
                amount: totalDistanceFee
            });
            
            calculation.categories.transport.subtotal = totalDistanceFee;
        }
        


        // 保険適用前合計
        calculation.totalBeforeInsurance = 
            calculation.categories.medical.subtotal +
            calculation.categories.visit.subtotal +
            calculation.categories.nursing.subtotal +
            calculation.categories.transport.subtotal;

        // 保険適用の計算（3区分に分けて処理）
        // 保険適用前の各カテゴリの金額を保存
        const medicalInsuranceCovered = calculation.categories.medical.subtotal + calculation.categories.visit.subtotal;
        const nursingInsuranceCovered = calculation.categories.nursing.subtotal;
        const selfPayAmount = calculation.categories.transport.subtotal;
        
        // 各カテゴリの元の金額を保存
        calculation.categories.medical.originalAmount = calculation.categories.medical.subtotal;
        calculation.categories.visit.originalAmount = calculation.categories.visit.subtotal;
        calculation.categories.nursing.originalAmount = calculation.categories.nursing.subtotal;
        
        // 医療保険適用分の自己負担額を計算（高額療養費適用前）
        const originalMedicalBurden = Math.ceil(medicalInsuranceCovered * (data.insuranceRate / 100));
        
        // 高額療養費制度の適用
        let hasHighCostLimit = false;
        let highCostLimit = 0;
        let totalMedicalPatientBurden = originalMedicalBurden;
        
        if (medicalInsuranceCovered > 0 && data.incomeLevel && data.incomeLevel !== '') {
            highCostLimit = this.calculateHighCostMedicalLimit(medicalInsuranceCovered, data.incomeLevel);
            
            if (originalMedicalBurden > highCostLimit) {
                totalMedicalPatientBurden = highCostLimit;
                hasHighCostLimit = true;
            }
        }
        
        // 介護保険適用分の自己負担額を計算
        const nursingPatientBurden = (nursingInsuranceCovered > 0 && data.nursingRate > 0) ? 
            Math.ceil(nursingInsuranceCovered * (data.nursingRate / 100)) : 0;
        
        // 医療保険分の負担率を計算（高額療養費適用後）
        const medicalRatio = medicalInsuranceCovered > 0 ? (totalMedicalPatientBurden / medicalInsuranceCovered) : 0;
        
        // 各カテゴリの自己負担額を計算
        const medicalCategoryBurden = calculation.categories.medical.subtotal > 0 ? 
            Math.ceil(calculation.categories.medical.subtotal * medicalRatio) : 0;
        const visitCategoryBurden = calculation.categories.visit.subtotal > 0 ? 
            Math.ceil(calculation.categories.visit.subtotal * medicalRatio) : 0;
        
        // 各分野の保険適用情報を更新
        calculation.categories.medical.patientBurden = medicalCategoryBurden;
        calculation.categories.medical.subtotal = medicalCategoryBurden;
        
        calculation.categories.visit.patientBurden = visitCategoryBurden;
        calculation.categories.visit.subtotal = visitCategoryBurden;
        
        calculation.categories.nursing.patientBurden = nursingPatientBurden;
        calculation.categories.nursing.subtotal = nursingPatientBurden;
        
        // 年齢確認
        const is70OrOlder = data.incomeLevel && (data.incomeLevel.startsWith('70-74歳_') || data.incomeLevel.startsWith('75歳～_'));
        const isGeneralIncome70Plus = is70OrOlder && data.incomeLevel.endsWith('_一般');
        const isLowIncome = data.incomeLevel && (data.incomeLevel.endsWith('_低所得Ⅰ') || data.incomeLevel.endsWith('_低所得Ⅱ'));
        
        // 保険情報を追加
        calculation.insuranceInfo = {
            medicalRate: data.insuranceRate,
            nursingRate: data.nursingRate,
            medicalOriginal: medicalInsuranceCovered,
            medicalBurden: totalMedicalPatientBurden,
            originalMedicalBurden: originalMedicalBurden,
            nursingOriginal: nursingInsuranceCovered,
            nursingBurden: nursingPatientBurden,
            selfPay: selfPayAmount,
            hasHighCostLimit: hasHighCostLimit,
            highCostLimit: hasHighCostLimit ? highCostLimit : null,
            incomeLevel: data.incomeLevel || '',
            is70OrOlder: is70OrOlder,
            isGeneralIncome70Plus: isGeneralIncome70Plus,
            isLowIncome: isLowIncome,
            isCanPatient: data.patientType === '在宅がん医療総合診療料' || data.nursingPatientType === '在宅がん医療総合診療料'
        };
    }

    calculateHomeNursingFees(data, calculation) {
        // 訪問看護の計算ロジック（フィードバック対応版）
        
        const patientType = data.nursingPatientType;
        
        // 在がんの場合：基本療養費は医療保険で包括されるため、自費部分は発生しない
        if (patientType === '在宅がん医療総合診療料') {
            
            // 在がんでも医療保険の加算のみ計算される
            // 基本療養費は包括されるため除外、自費部分も発生しない
            
            // 自費部分を計算（在がんの場合は何も追加されない）
            this.calculateNursingSelfPayFees(data, calculation);
            
            // 在がんの場合でも医療保険の加算は計算される
            if (data.medicalInsuranceAdditions && data.medicalInsuranceAdditions.length > 0) {
                data.medicalInsuranceAdditions.forEach(additionKey => {
                    const additionFee = this.nursingCareFees.medicalInsuranceAdditions[additionKey] || 0;
                    
                    if (additionFee > 0) {
                        const additionName = additionKey.split('-')[0];
                        calculation.categories.nursingAddition.items.push({
                            name: `医療保険加算（${additionName}）`,
                            detail: '月額',
                            amount: additionFee
                        });
                        calculation.categories.nursingAddition.subtotal += additionFee;
                    }
                });
            }
            
            return;
        }
        
        // 1. 基本療養費の計算（介護保険・医療保険）
        if (patientType === '介護保険（要介護）' || patientType === '介護保険（要支援）' || patientType === '医療保険') {
            const nursingDuration = data.nursingDuration;
            const rehabDuration = data.rehabDuration;
            
            let totalBasicFee = 0;
            
            if (patientType && data.weeklyNursingVisits > 0 && (patientType === '医療保険' || nursingDuration)) {
                // 看護の基本療養費計算
                const basicFeeStructure = this.nursingCareFees.basicFee[patientType];
                if (basicFeeStructure && basicFeeStructure['看護のみ']) {
                    let nursingBasicFeePerVisit = 0;
                    
                    if (patientType === '医療保険') {
                        // 医療保険：週3日目まで5550円/回、週4日目以降6550円/回
                        const weeklyVisits = data.weeklyNursingVisits || 0;
                        let weeklyTotalFee = 0;
                        
                        for (let i = 1; i <= weeklyVisits; i++) {
                            if (i <= 3) {
                                weeklyTotalFee += 5550; // 週3日目まで
                            } else {
                                weeklyTotalFee += 6550; // 週4日目以降
                            }
                        }
                        
                        // 月間料金（週料金 × 4週）
                        totalBasicFee = weeklyTotalFee * 4;
                        
                        calculation.categories.nursingBasic.items.push({
                            name: '基本療養費（医療保険）',
                            detail: `週${weeklyVisits}回 × 4週（${weeklyVisits <= 3 ? 
                                `${weeklyVisits}回 × 5550円` : 
                                `3回 × 5550円 + ${weeklyVisits - 3}回 × 6550円`}）`,
                            amount: totalBasicFee
                        });
                        calculation.categories.nursingBasic.subtotal = totalBasicFee;
                        
                        // 既に月間計算済みなので、この後の月間計算をスキップ
                        nursingBasicFeePerVisit = 0; // 後続の月間計算を無効化
                    } else {
                        // 介護保険は時間別料金
                        // 区分表示（Ⅰ1〜Ⅰ4）を除去して基本の時間区分のみを使用
                        const cleanDuration = nursingDuration.replace(/（.*?）/g, '').trim();
                        nursingBasicFeePerVisit = basicFeeStructure['看護のみ'][cleanDuration] || 0;
                    }
                    
                    // 看護の月間訪問回数を計算（医療保険以外）
                    if (patientType !== '医療保険' && nursingBasicFeePerVisit > 0) {
                        const monthlyNursingVisits = (data.weeklyNursingVisits || 0) * 4;
                        totalBasicFee += nursingBasicFeePerVisit * monthlyNursingVisits;
                    }
                }
            }
            
            if (patientType && rehabDuration && data.weeklyRehabVisits > 0) {
                // リハビリの基本療養費計算
                const basicFeeStructure = this.nursingCareFees.basicFee[patientType];
                if (basicFeeStructure && basicFeeStructure['看護+セラピスト']) {
                    let rehabBasicFeePerVisit = 0;
                    
                    // リハビリは全て「看護+セラピスト」として計算
                    if (patientType === '医療保険') {
                        // 医療保険のリハビリは実装されていないため0円
                        rehabBasicFeePerVisit = 0;
                    } else {
                        // 介護保険のリハビリ（Ⅰ5）
                        // リハビリ時間を看護+セラピスト料金に対応
                        if (rehabDuration === '20分' || rehabDuration === '40分' || rehabDuration === '60分') {
                            rehabBasicFeePerVisit = basicFeeStructure['看護+セラピスト']['1時間未満'] || 0;
                        }
                    }
                    
                    // リハビリの月間訪問回数を計算
                    const monthlyRehabVisits = (data.weeklyRehabVisits || 0) * 4;
                    totalBasicFee += rehabBasicFeePerVisit * monthlyRehabVisits;
                }
            }
                    
            if (totalBasicFee > 0 && patientType !== '医療保険') {
                let detailParts = [];
                if (data.weeklyNursingVisits > 0) {
                    const monthlyNursingVisits = data.weeklyNursingVisits * 4;
                    detailParts.push(`看護:週${data.weeklyNursingVisits}回（月${monthlyNursingVisits}回）`);
                }
                if (data.weeklyRehabVisits > 0) {
                    const monthlyRehabVisits = data.weeklyRehabVisits * 4;
                    detailParts.push(`リハビリ:週${data.weeklyRehabVisits}回（月${monthlyRehabVisits}回）`);
                }
                
                calculation.categories.nursingBasic.items.push({
                    name: `基本療養費（${patientType}）`,
                    detail: detailParts.join('、'),
                    amount: totalBasicFee
                });
                calculation.categories.nursingBasic.subtotal = totalBasicFee;
            }
        }
        
        // 2. 介護保険の加算（複数選択対応）
        if ((patientType === '介護保険（要介護）' || patientType === '介護保険（要支援）') && data.careInsuranceAdditions && data.careInsuranceAdditions.length > 0) {
            data.careInsuranceAdditions.forEach(additionKey => {
                const additionFee = this.nursingCareFees.careInsuranceAdditions[additionKey] || 0;
                
                if (additionFee > 0) {
                    const additionName = additionKey.split('-')[0];
                    calculation.categories.nursingAddition.items.push({
                        name: `介護保険加算（${additionName}）`,
                        detail: additionKey.includes('回') ? '回数別' : '月額',
                        amount: additionFee
                    });
                    calculation.categories.nursingAddition.subtotal += additionFee;
                }
            });
        }
        
        // 3. 医療保険の加算（複数選択対応・オンライン資格確認加算統合）
        if ((patientType === '医療保険' || patientType === '在宅がん医療総合診療料') && data.medicalInsuranceAdditions && data.medicalInsuranceAdditions.length > 0) {
            data.medicalInsuranceAdditions.forEach(additionKey => {
                let additionFee = 0;
                let additionName = '';
                
                if (additionKey === 'オンライン資格確認加算-50') {
                    additionFee = 50;
                    additionName = 'オンライン資格確認加算';
                } else {
                    additionFee = this.nursingCareFees.medicalInsuranceAdditions[additionKey] || 0;
                    additionName = additionKey.split('-')[0];
                }
                
                if (additionFee > 0) {
                    calculation.categories.nursingAddition.items.push({
                        name: `医療保険加算（${additionName}）`,
                        detail: '月額',
                        amount: additionFee
                    });
                    calculation.categories.nursingAddition.subtotal += additionFee;
                }
            });
        }
        
        // 5. 自費部分の計算
        this.calculateNursingSelfPayFees(data, calculation);
    }

    calculateNursingSelfPayFees(data, calculation) {
        // 在がん患者の場合：自費部分は発生しない
        if (data.nursingPatientType === '在宅がん医療総合診療料') {
            // 在がんの場合は基本療養費が医療保険で包括算定されるため、自費部分は発生しない
            // 何も追加しない
        }
        
        // 自費（日曜日定期訪問）
        if (data.sundayRegularVisitTime > 0) {
            // 週単位での算定：30分/週=1000円/週×4週、60分/週=2000円/週×4週
            const weeklyFee = Math.ceil(data.sundayRegularVisitTime / 30) * 1000;
            const monthlyFee = weeklyFee * 4; // 4週分として計算
            
            calculation.categories.nursingTransport.items.push({
                name: '自費（日曜日定期訪問）',
                detail: `${data.sundayRegularVisitTime}分/週 × 4週（${weeklyFee}円/週 × 4週）`,
                amount: monthlyFee
            });
            calculation.categories.nursingTransport.subtotal += monthlyFee;
        }
        
        // 注：訪問看護では交通費は発生しないため、交通費計算は除外
    }

    calculateTotalFees(data, calculation) {
        // 各カテゴリの合計を計算
        let totalBeforeInsurance = 0;
        let totalAfterInsurance = 0;
        
        // 訪問診療の合計（初期処理 - 訪問看護との合算計算は後で実行）
        if (data.serviceType === 'home-medical' || data.serviceType === 'both') {
            totalBeforeInsurance += (calculation.categories.medical?.originalAmount || calculation.categories.medical?.subtotal || 0);
            totalBeforeInsurance += (calculation.categories.visit?.originalAmount || calculation.categories.visit?.subtotal || 0);
            totalBeforeInsurance += (calculation.categories.nursing?.originalAmount || calculation.categories.nursing?.subtotal || 0);
            totalBeforeInsurance += (calculation.categories.transport?.subtotal || 0);
            
            // 訪問看護と医療保険を合算する場合は、後で再計算するため、ここでは仮計算
            totalAfterInsurance += (calculation.categories.medical?.patientBurden || calculation.categories.medical?.subtotal || 0);
            totalAfterInsurance += (calculation.categories.visit?.patientBurden || calculation.categories.visit?.subtotal || 0);
            totalAfterInsurance += (calculation.categories.nursing?.patientBurden || calculation.categories.nursing?.subtotal || 0);
            totalAfterInsurance += (calculation.categories.transport?.subtotal || 0);
        }
        
        // 訪問看護の合計
        if (data.serviceType === 'home-nursing' || data.serviceType === 'both') {
            const nursingBasicTotal = calculation.categories.nursingBasic?.subtotal || 0;
            const nursingManagementTotal = calculation.categories.nursingManagement?.subtotal || 0;
            const nursingAdditionTotal = calculation.categories.nursingAddition?.subtotal || 0;
            const nursingTransportTotal = calculation.categories.nursingTransport?.subtotal || 0;
            

            

            
            // 3区分に分けて処理
            let nursingMedicalInsuranceCovered = 0;  // 医療保険適用分
            let nursingCareInsuranceCovered = 0;     // 介護保険適用分
            let nursingSelfPayAmount = nursingTransportTotal; // 自費分（交通費等）
            
            // 患者タイプに応じて保険区分を決定
            if (data.nursingPatientType === '在宅がん医療総合診療料') {
                // 在がんの場合：基本療養費は医療保険で包括されるため、管理療養費と加算のみ医療保険
                nursingMedicalInsuranceCovered = nursingManagementTotal + nursingAdditionTotal;
                nursingCareInsuranceCovered = 0;
            } else if (data.nursingPatientType === '医療保険') {
                // 医療保険の場合：基本療養費・管理療養費・加算すべて医療保険
                nursingMedicalInsuranceCovered = nursingBasicTotal + nursingManagementTotal + nursingAdditionTotal;
                nursingCareInsuranceCovered = 0;
            } else if (data.nursingPatientType === '介護保険（要介護）' || data.nursingPatientType === '介護保険（要支援）') {
                // 介護保険の場合：すべて介護保険
                nursingMedicalInsuranceCovered = 0;
                nursingCareInsuranceCovered = nursingBasicTotal + nursingManagementTotal + nursingAdditionTotal;
            } else {
                // 未定義の患者タイプの場合、全額自己負担
                nursingMedicalInsuranceCovered = 0;
                nursingCareInsuranceCovered = 0;
                nursingSelfPayAmount += nursingBasicTotal + nursingManagementTotal + nursingAdditionTotal;
            }
            
            // 保険適用前の合計に加算
            totalBeforeInsurance += nursingMedicalInsuranceCovered + nursingCareInsuranceCovered + nursingSelfPayAmount;
            
            // 訪問看護の医療保険分を訪問診療と合算して高額療養費制度を適用
            if (nursingMedicalInsuranceCovered > 0) {
                // 既存の訪問診療の医療保険適用額を取得
                const homeMedicalInsuranceCovered = (calculation.categories.medical?.originalAmount || 0) + 
                                                  (calculation.categories.visit?.originalAmount || 0);
                
                // 医療保険分を合算
                const totalMedicalInsuranceCovered = homeMedicalInsuranceCovered + nursingMedicalInsuranceCovered;
                
                // 合算後の自己負担額を計算（高額療養費適用前）
                const originalCombinedMedicalBurden = Math.ceil(totalMedicalInsuranceCovered * (data.insuranceRate / 100));
                
                // 高額療養費制度を適用
                let hasHighCostLimit = false;
                let highCostLimit = 0;
                let totalCombinedMedicalBurden = originalCombinedMedicalBurden;
                
                if (totalMedicalInsuranceCovered > 0 && data.incomeLevel && data.incomeLevel !== '') {
                    highCostLimit = this.calculateHighCostMedicalLimit(totalMedicalInsuranceCovered, data.incomeLevel);
                    
                    if (originalCombinedMedicalBurden > highCostLimit) {
                        totalCombinedMedicalBurden = highCostLimit;
                        hasHighCostLimit = true;
                    }
                }
                
                // 合算後の負担率を計算
                const combinedMedicalRatio = totalMedicalInsuranceCovered > 0 ? 
                    (totalCombinedMedicalBurden / totalMedicalInsuranceCovered) : 0;
                
                // 訪問診療と訪問看護の医療保険分を按分
                const nursingMedicalBurden = nursingMedicalInsuranceCovered > 0 ? 
                    Math.ceil(nursingMedicalInsuranceCovered * combinedMedicalRatio) : 0;
                
                // 訪問診療の医療保険分を再計算（既に totalAfterInsurance に含まれているので差し引いてから再追加）
                if (homeMedicalInsuranceCovered > 0 && data.serviceType === 'both') {
                    // 既存の訪問診療分をtotalAfterInsuranceから差し引く
                    totalAfterInsurance -= (calculation.categories.medical?.patientBurden || calculation.categories.medical?.subtotal || 0);
                    totalAfterInsurance -= (calculation.categories.visit?.patientBurden || calculation.categories.visit?.subtotal || 0);
                    
                    const homeMedicalBurden = Math.ceil(homeMedicalInsuranceCovered * combinedMedicalRatio);
                    
                    // 各カテゴリの負担額を按分更新
                    const homeMedicalRatio = homeMedicalInsuranceCovered > 0 ? (homeMedicalBurden / homeMedicalInsuranceCovered) : 0;
                    
                    if (calculation.categories.medical && calculation.categories.medical.originalAmount > 0) {
                        calculation.categories.medical.patientBurden = Math.ceil(calculation.categories.medical.originalAmount * homeMedicalRatio);
                        calculation.categories.medical.subtotal = calculation.categories.medical.patientBurden;
                        totalAfterInsurance += calculation.categories.medical.patientBurden;
                    }
                    
                    if (calculation.categories.visit && calculation.categories.visit.originalAmount > 0) {
                        calculation.categories.visit.patientBurden = Math.ceil(calculation.categories.visit.originalAmount * homeMedicalRatio);
                        calculation.categories.visit.subtotal = calculation.categories.visit.patientBurden;
                        totalAfterInsurance += calculation.categories.visit.patientBurden;
                    }
                }
                
                // 訪問看護の医療保険適用カテゴリを更新
                totalAfterInsurance += nursingMedicalBurden;
                
                // 保険情報を更新
                if (calculation.insuranceInfo) {
                    calculation.insuranceInfo.medicalOriginal = totalMedicalInsuranceCovered;
                    calculation.insuranceInfo.medicalBurden = totalCombinedMedicalBurden;
                    calculation.insuranceInfo.hasHighCostLimit = hasHighCostLimit;
                    calculation.insuranceInfo.highCostLimit = hasHighCostLimit ? highCostLimit : null;
                }
                
                // 合算後の医療保険負担率を保存
                calculation.combinedMedicalRatio = combinedMedicalRatio;
                
            } else {
                // 訪問看護に医療保険分がない場合
                calculation.combinedMedicalRatio = 0;
            }
            
            // 介護保険適用分の自己負担額を計算
            const nursingCarePatientBurden = nursingCareInsuranceCovered > 0 ? 
                Math.ceil(nursingCareInsuranceCovered * (data.nursingRate / 100)) : 0;
            
            totalAfterInsurance += nursingCarePatientBurden + nursingSelfPayAmount;
            

            
            // カテゴリ別の患者負担を設定
            if (calculation.categories.nursingBasic) {
                calculation.categories.nursingBasic.originalAmount = calculation.categories.nursingBasic.subtotal;
                
                if (data.nursingPatientType === '在宅がん医療総合診療料') {
                    // 在がんの場合：基本療養費は医療保険で包括されるため0円
                    calculation.categories.nursingBasic.patientBurden = 0;
                    calculation.categories.nursingBasic.subtotal = 0;
                    calculation.categories.nursingBasic.note = '※医療保険で包括算定';
                } else if (data.nursingPatientType === '医療保険') {
                    // 医療保険の場合：元の負担率で表示（合算計算は別途実施）
                    const rate = data.insuranceRate || 30;
                    calculation.categories.nursingBasic.patientBurden = Math.ceil(calculation.categories.nursingBasic.subtotal * (rate / 100));
                    calculation.categories.nursingBasic.subtotal = calculation.categories.nursingBasic.patientBurden;
                } else {
                    // 介護保険の場合
                    const rate = data.nursingRate || 10;
                    calculation.categories.nursingBasic.patientBurden = Math.ceil(calculation.categories.nursingBasic.subtotal * (rate / 100));
                    calculation.categories.nursingBasic.subtotal = calculation.categories.nursingBasic.patientBurden;
                }
            }
            
            if (calculation.categories.nursingManagement) {
                calculation.categories.nursingManagement.originalAmount = calculation.categories.nursingManagement.subtotal;
                
                if (data.nursingPatientType === '医療保険' || data.nursingPatientType === '在宅がん医療総合診療料') {
                    // 医療保険の場合：元の負担率で表示（合筗計算は別途実施）
                    const rate = data.insuranceRate || 30;
                    calculation.categories.nursingManagement.patientBurden = Math.ceil(calculation.categories.nursingManagement.subtotal * (rate / 100));
                } else {
                    // 介護保険の場合
                    const rate = data.nursingRate || 10;
                    calculation.categories.nursingManagement.patientBurden = Math.ceil(calculation.categories.nursingManagement.subtotal * (rate / 100));
                }
                calculation.categories.nursingManagement.subtotal = calculation.categories.nursingManagement.patientBurden;
            }
            
            if (calculation.categories.nursingAddition) {
                calculation.categories.nursingAddition.originalAmount = calculation.categories.nursingAddition.subtotal;
                
                if (data.nursingPatientType === '医療保険' || data.nursingPatientType === '在宅がん医療総合診療料') {
                    // 医療保険の場合：元の負担率で表示（合算計算は別途実施）
                    const rate = data.insuranceRate || 30;
                    calculation.categories.nursingAddition.patientBurden = Math.ceil(calculation.categories.nursingAddition.subtotal * (rate / 100));
                } else {
                    // 介護保険の場合
                    const rate = data.nursingRate || 10;
                    calculation.categories.nursingAddition.patientBurden = Math.ceil(calculation.categories.nursingAddition.subtotal * (rate / 100));
                }
                calculation.categories.nursingAddition.subtotal = calculation.categories.nursingAddition.patientBurden;
            }
        }
        
        // 最終合計を設定
        calculation.totalBeforeInsurance = totalBeforeInsurance;
        calculation.totalAfterInsurance = totalAfterInsurance;
        

    }

    handleComparisonToggle(event) {
        const button = event.target;
        const comparisonControls = document.getElementById('comparisonControls');
        
        // ボタンの状態を切り替え
        if (button.classList.contains('active')) {
            // 比較モードを無効化
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-chart-bar"></i> 別のプランと比較する';
            comparisonControls.style.display = 'none';
            // 比較データをクリア
            this.comparisonPlans = [];
            this.updateComparisonButtons();
            this.comparisonSection.style.display = 'none';
        } else {
            // 比較モードを有効化
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-times"></i> 比較を終了する';
            comparisonControls.style.display = 'flex';
        }
    }

    handleAddPlan() {
        // 現在の計算結果を比較プランに追加
        if (this.resultSection.style.display === 'none') {
            this.showError('先に料金計算を行ってください。');
            return;
        }
        
        const formData = this.getFormData();
        const calculationResult = this.calculateFee(formData);
        
        this.planCounter++;
        const planData = {
            id: this.planCounter,
            name: `プラン${this.planCounter}`,
            formData: formData,
            calculation: calculationResult,
            timestamp: new Date().toLocaleString('ja-JP')
        };
        
        this.comparisonPlans.push(planData);
        this.updateComparisonButtons();
        this.showSuccess(`プラン${this.planCounter}を比較に追加しました。`);
    }

    handleShowComparison() {
        if (this.comparisonPlans.length === 0) {
            this.showError('比較するプランがありません。');
            return;
        }
        
        this.displayComparisonTable();
        this.comparisonSection.style.display = 'block';
        this.comparisonSection.scrollIntoView({ behavior: 'smooth' });
    }

    handleClearComparison() {
        this.comparisonPlans = [];
        this.planCounter = 0;
        this.updateComparisonButtons();
        this.comparisonSection.style.display = 'none';
        this.showSuccess('比較データをクリアしました。');
    }

    handlePrintComparison() {
        if (this.comparisonPlans.length === 0) {
            this.showError('印刷する比較データがありません。');
            return;
        }
        
        // 比較表の印刷機能を実装
        const printWindow = window.open('', '_blank');
        const printContent = this.generateComparisonPrintContent();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        };
    }

    updateComparisonButtons() {
        const showComparisonButton = document.getElementById('showComparisonButton');
        if (this.comparisonPlans.length > 0) {
            showComparisonButton.style.display = 'inline-flex';
            showComparisonButton.textContent = `比較表を表示 (${this.comparisonPlans.length}プラン)`;
        } else {
            showComparisonButton.style.display = 'none';
        }
    }

    displayComparisonTable() {
        if (this.comparisonPlans.length === 0) return;
        
        let tableHTML = '<thead><tr><th>項目</th>';
        
        // ヘッダー行を作成
        this.comparisonPlans.forEach(plan => {
            tableHTML += `<th class="plan-header">${plan.name}<br><small>${plan.timestamp}</small></th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // 基本情報行
        const basicRows = [
            { label: '訪問診療利用', key: 'homeMedical' },
            { label: '訪問看護利用', key: 'homeNursing' },
            { label: '患者タイプ（訪問診療）', key: 'patientType' },
            { label: '患者タイプ（訪問看護）', key: 'nursingPatientType' },
            { label: '医療保険負担割合', key: 'insuranceRate' },
            { label: '介護保険負担割合', key: 'nursingRate' },
            { label: '月間訪問日数', key: 'monthlyVisits' },
            { label: '距離', key: 'distance' }
        ];
        
        basicRows.forEach(row => {
            tableHTML += `<tr><td><strong>${row.label}</strong></td>`;
            this.comparisonPlans.forEach(plan => {
                let cellValue = '';
                if (row.key === 'homeMedical') {
                    cellValue = plan.formData.disableHomeMedical ? '<span class="service-disabled">利用しない</span>' : '利用する';
                } else if (row.key === 'homeNursing') {
                    cellValue = plan.formData.disableHomeNursing ? '<span class="service-disabled">利用しない</span>' : '利用する';
                } else if (row.key === 'insuranceRate') {
                    cellValue = `${Math.floor((plan.formData[row.key] || 0) / 10)}割負担`;
                } else if (row.key === 'nursingRate') {
                    cellValue = `${Math.floor((plan.formData[row.key] || 0) / 10)}割負担`;
                } else if (row.key === 'distance') {
                    cellValue = `${plan.formData[row.key] || 0}km`;
                } else if (row.key === 'monthlyVisits') {
                    cellValue = `${plan.formData[row.key] || 0}日`;
                } else {
                    cellValue = plan.formData[row.key] || '-';
                }
                tableHTML += `<td>${cellValue}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        // 料金比較行
        tableHTML += '<tr class="total-row"><td><strong>月額利用料金</strong></td>';
        this.comparisonPlans.forEach(plan => {
            const totalAmount = plan.calculation.totalAfterInsurance || 0;
            tableHTML += `<td>¥${totalAmount.toLocaleString()}</td>`;
        });
        tableHTML += '</tr>';
        
        // 訪問診療・訪問看護別の料金
        if (this.comparisonPlans.some(plan => !plan.formData.disableHomeMedical && !plan.formData.disableHomeNursing)) {
            tableHTML += '<tr><td><strong>訪問診療料金</strong></td>';
            this.comparisonPlans.forEach(plan => {
                const medicalTotal = this.calculateServiceTotal(plan.calculation, 'medical');
                const cellValue = plan.formData.disableHomeMedical ? '<span class="service-disabled">¥0</span>' : `¥${medicalTotal.toLocaleString()}`;
                tableHTML += `<td>${cellValue}</td>`;
            });
            tableHTML += '</tr>';
            
            tableHTML += '<tr><td><strong>訪問看護料金</strong></td>';
            this.comparisonPlans.forEach(plan => {
                const nursingTotal = this.calculateServiceTotal(plan.calculation, 'nursing');
                const cellValue = plan.formData.disableHomeNursing ? '<span class="service-disabled">¥0</span>' : `¥${nursingTotal.toLocaleString()}`;
                tableHTML += `<td>${cellValue}</td>`;
            });
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody>';
        this.comparisonTable.innerHTML = tableHTML;
    }

    calculateServiceTotal(calculation, serviceType) {
        if (serviceType === 'medical') {
            const medicalCategories = ['medical', 'visit', 'nursing', 'transport'];
            return medicalCategories.reduce((total, categoryKey) => {
                const category = calculation.categories[categoryKey];
                return total + (category?.subtotal || 0);
            }, 0);
        } else if (serviceType === 'nursing') {
            const nursingCategories = ['nursingBasic', 'nursingManagement', 'nursingAddition', 'nursingTransport'];
            return nursingCategories.reduce((total, categoryKey) => {
                const category = calculation.categories[categoryKey];
                return total + (category?.subtotal || 0);
            }, 0);
        }
        return 0;
    }

    generateComparisonPrintContent() {
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>プラン比較表 - 新生病院</title>
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; font-size: 12pt; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total-row td { background-color: #e8f5e8; font-weight: bold; }
        .service-disabled { color: #6c757d; font-style: italic; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header p { color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>在宅医療 費用概算 プラン比較表</h1>
        <p>特定医療法人　新生病院</p>
        <p>作成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
    <table>${this.comparisonTable.innerHTML}</table>
</body>
</html>`;
    }

    showSuccess(message) {
        // 簡易的な成功メッセージ表示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #4CAF50; color: white; padding: 15px 20px;
            border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    calculateDistanceFee(distance) {
        const feeInfo = this.distanceFees.find(f => distance >= f.min && distance < f.max);
        return feeInfo ? feeInfo.fee : this.distanceFees[this.distanceFees.length - 1].fee;
    }




    calculateHighCostMedicalLimit(medicalCost, incomeLevel) {
        // 高額療養費制度の自己負担上限額計算（外来医療費）
        let limit = 0;
        
        // 所得水準から年齢区分と所得区分を分離
        if (incomeLevel.startsWith('70-74歳_') || incomeLevel.startsWith('75歳～_')) {
            // 70歳以上（外来個人ごと月額上限）
            const incomePart = incomeLevel.split('_')[1];
            switch(incomePart) {
                case '現役並み所得Ⅲ':
                    // 690万円以上：252,600円＋(医療費－842,000円)×1%
                    limit = 252600 + Math.max(0, Math.floor((medicalCost - 842000) * 0.01));
                    break;
                case '現役並み所得Ⅱ':
                    // 380万円以上：167,400円＋(医療費－558,000円)×1%
                    limit = 167400 + Math.max(0, Math.floor((medicalCost - 558000) * 0.01));
                    break;
                case '現役並み所得Ⅰ':
                    // 145万円以上：80,100円＋(医療費－267,000円)×1%
                    limit = 80100 + Math.max(0, Math.floor((medicalCost - 267000) * 0.01));
                    break;
                case '一般':
                    // 145万円未満：18,000円（年間上限144,000円）
                    limit = 18000;
                    break;
                case '低所得Ⅱ':
                    // 住民税非課税：8,000円
                    limit = 8000;
                    break;
                case '低所得Ⅰ':
                    // 住民税非課税・年金収入80万円以下：8,000円
                    limit = 8000;
                    break;
                default:
                    limit = 18000;
            }
        } else {
            // 69歳以下（協会けんぽの区分）
            switch(incomeLevel) {
                case '年収約1,160万円～':
                    // 区分ア：252,600円＋(医療費－842,000円)×1%
                    limit = 252600 + Math.max(0, Math.floor((medicalCost - 842000) * 0.01));
                    break;
                case '年収約770～1,160万円':
                    // 区分イ：167,400円＋(医療費－558,000円)×1%
                    limit = 167400 + Math.max(0, Math.floor((medicalCost - 558000) * 0.01));
                    break;
                case '年収約370～770万円':
                    // 区分ウ：80,100円＋(医療費－267,000円)×1%
                    limit = 80100 + Math.max(0, Math.floor((medicalCost - 267000) * 0.01));
                    break;
                case '年収～370万円':
                    // 区分エ：57,600円
                    limit = 57600;
                    break;
                case '住民税非課税':
                    // 区分オ：35,400円
                    limit = 35400;
                    break;
                default:
                    // デフォルトは区分ウを適用
                    limit = 80100 + Math.max(0, Math.floor((medicalCost - 267000) * 0.01));
            }
        }
        
        return Math.floor(limit);
    }
    
    isNursingInsuranceApplicable(data) {
        // 介護保険サービス利用が「あり」と選択された場合
        // これは以下の条件を満たす場合を想定：
        // 1. 75歳以上（第1号被保険者）
        // 2. 40歳以上で要介護認定を受けている（第2号被保険者）
        return data.nursingService === 'あり';
    }



    displayResult(calculation) {

        
        // 結果セクションを表示
        this.resultSection.style.display = 'block';
        
        // 総額表示 - NaN防止
        const totalAmount = calculation.totalAfterInsurance || 0;
        this.totalAmountDisplay.textContent = isNaN(totalAmount) ? '0' : totalAmount.toLocaleString();
        
        // 内訳表示
        this.breakdownContainer.innerHTML = '';
        
        // 基本情報 - NaN防止
        const beforeInsuranceTotal = calculation.totalBeforeInsurance || 0;
        const medicalRate = calculation.insuranceInfo?.medicalRate || 0;
        const nursingRate = calculation.insuranceInfo?.nursingRate || 0;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'result-info';
        
        // サービスタイプに応じた基本情報表示
        let infoHtml = `<h4>サービス: ${this.getServiceTypeLabel(calculation.serviceType)}</h4>`;
        
        if (calculation.serviceType === 'home-medical' || calculation.serviceType === 'both') {
            infoHtml += `<h4>患者タイプ: ${calculation.patientType || ''}</h4>`;
            if (calculation.severity) {
                infoHtml += `<p>重症度: ${calculation.severity}</p>`;
            }
        }
        
        infoHtml += `<p>医療保険負担割合: ${Math.floor(medicalRate / 10)}割負担</p>`;
        infoHtml += `<p>介護保険負担割合: ${Math.floor(nursingRate / 10)}割負担</p>`;
        infoHtml += `<p>保険適用前合計: ¥${isNaN(beforeInsuranceTotal) ? '0' : beforeInsuranceTotal.toLocaleString()}</p>`;
        
        infoDiv.innerHTML = infoHtml;
        this.breakdownContainer.appendChild(infoDiv);

        // サービス別料金表示
        this.displayServiceBreakdown(calculation);
        


        // 保険適用情報の表示 - NaN防止
        if (calculation.insuranceInfo) {
            const info = calculation.insuranceInfo;
            const medicalOriginal = info.medicalOriginal || 0;
            const medicalBurden = info.medicalBurden || 0;
            const nursingOriginal = info.nursingOriginal || 0;
            const nursingBurden = info.nursingBurden || 0;
            const selfPay = info.selfPay || 0;
            const medicalRate = info.medicalRate || 0;
            const nursingRate = info.nursingRate || 0;
        }
        
        // 最終合計 - NaN防止
        const finalTotal = calculation.totalAfterInsurance || 0;
        const totalDiv = document.createElement('div');
        totalDiv.className = 'breakdown-item total';
        
        // 高額療養費制度適用の根拠を表示
        let explanationText = '保険適用後の合計額';
        if (calculation.insuranceInfo?.hasHighCostLimit) {
            explanationText = `高額療養費制度適用（上限額: ¥${calculation.insuranceInfo.highCostLimit.toLocaleString()}）`;
        } else if (calculation.insuranceInfo?.hasUpperLimit && calculation.insuranceInfo?.isGeneralIncome70Plus) {
            const nursingAmount = (calculation.categories.nursing?.patientBurden || 0) + 
                                  (calculation.categories.nursingBasic?.patientBurden || calculation.categories.nursingBasic?.subtotal || 0) +
                                  (calculation.categories.nursingManagement?.patientBurden || calculation.categories.nursingManagement?.subtotal || 0) +
                                  (calculation.categories.nursingAddition?.patientBurden || calculation.categories.nursingAddition?.subtotal || 0);
            const selfPayAmount = (calculation.categories.transport?.subtotal || 0) + (calculation.categories.nursingTransport?.subtotal || 0);
            
            explanationText = `70歳以上外来上限18,000円 + 介護保険${nursingAmount.toLocaleString()}円 + 自費${selfPayAmount.toLocaleString()}円`;
        }
        
        totalDiv.innerHTML = `
            <div class="breakdown-name">
                <strong>月額自己負担額</strong>
                <small>${explanationText}</small>
            </div>
            <div class="breakdown-amount">
                ¥${isNaN(finalTotal) ? '0' : finalTotal.toLocaleString()}
            </div>
        `;
        this.breakdownContainer.appendChild(totalDiv);

        // 結果表示
        this.resultSection.style.display = 'block';
        this.scrollToResult();
    }

    async saveSimulationResult(formData, calculation) {
        try {
            const resultData = {
                ...formData,
                monthly_fee: calculation.totalAfterInsurance,
                breakdown: JSON.stringify(calculation),
                simulation_date: Date.now()
            };

            const response = await fetch('tables/simulation_results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resultData)
            });

            if (!response.ok) {
                console.warn('シミュレーション結果の保存に失敗しました');
            }
        } catch (error) {
            console.warn('シミュレーション結果保存エラー:', error);
        }
    }

    validateForm() {

        const disableHomeMedical = this.form.querySelector('[name="disableHomeMedical"]')?.checked || false;
        const disableHomeNursing = this.form.querySelector('[name="disableHomeNursing"]')?.checked || false;
        

        
        // 両方のサービスが無効になっていないかチェック
        if (disableHomeMedical && disableHomeNursing) {

            this.showError('訪問診療・訪問看護の少なくとも一つはご利用ください。');
            return false;
        }
        
        // サービスタイプを動的に決定
        let serviceType = 'both';
        if (disableHomeMedical) {
            serviceType = 'home-nursing';
        } else if (disableHomeNursing) {
            serviceType = 'home-medical';
        }
        
        let requiredFields = [];
        const missingFields = [];
        
        // 共通必須項目（どちらかのサービスが有効な場合）
        if (!disableHomeMedical || !disableHomeNursing) {
            requiredFields.push(
                { name: 'insuranceRate', label: '医療保険負担割合' },
                { name: 'nursingRate', label: '介護保険負担割合' },
                { name: 'incomeLevel', label: '所得水準' }
            );
        }
        
        // 訪問診療の必須項目（無効化されていない場合のみ）
        if (!disableHomeMedical && (serviceType === 'home-medical' || serviceType === 'both')) {
            requiredFields.push(
                { name: 'patientType', label: '患者タイプ' },
                { name: 'nursingService', label: '介護保険サービス利用' },
                { name: 'distance', label: '距離' },
                { name: 'monthlyVisits', label: '月間訪問日数' }
            );
            
            // 患者タイプに応じて重症度を必須項目に追加
            const patientTypeElement = this.form.querySelector('[name="patientType"]');
            const patientType = patientTypeElement ? patientTypeElement.value : '';
            
            // 在宅がん医療総合診療料以外の場合は重症度が必須
            if (patientType !== '在宅がん医療総合診療料') {
                requiredFields.push({ name: 'severity', label: '重症度' });
            } else {
                // 在宅がん医療総合診療料の場合は処方せん交付が必須
                requiredFields.push({ name: 'prescription', label: '処方せん交付' });
            }
        }
        
        // 訪問看護の必須項目（無効化されていない場合のみ）
        if (!disableHomeNursing && (serviceType === 'home-nursing' || serviceType === 'both')) {
            requiredFields.push(
                { name: 'nursingPatientType', label: '患者タイプ（訪問看護）' }
            );
            
            // 患者タイプに応じた必須項目
            const nursingPatientTypeElement = this.form.querySelector('[name="nursingPatientType"]');
            const nursingPatientType = nursingPatientTypeElement ? nursingPatientTypeElement.value : '';
            
            if (nursingPatientType === '介護保険（要介護）' || nursingPatientType === '介護保険（要支援）' || nursingPatientType === '医療保険') {
                requiredFields.push(
                    { name: 'weeklyNursingVisits', label: '（看護）週の訪問回数' }
                );
                
                if (nursingPatientType === '介護保険（要介護）' || nursingPatientType === '介護保険（要支援）') {
                    requiredFields.push({ name: 'nursingDuration', label: '（看護）訪問時間' });
                }
            }
            
            // 在がんの場合は自費部分のみなので基本的な必須項目は不要
            // ただし、患者タイプは必須
            if (nursingPatientType === '在宅がん医療総合診療料') {
                // 在がんの場合は特別な必須項目はない（自費部分のみ）
            }
            
            // 訪問看護の保険負担割合も必要
            if (serviceType === 'home-nursing') {
                const nursingPatientTypeElement = this.form.querySelector('[name="nursingPatientType"]');
                const nursingPatientType = nursingPatientTypeElement ? nursingPatientTypeElement.value : '';
                
                if (nursingPatientType === '医療保険' || nursingPatientType === '在宅がん医療総合診療料') {
                    requiredFields.push({ name: 'insuranceRate', label: '医療保険負担割合' });
                }
                if (nursingPatientType === '介護保険（要介護）' || nursingPatientType === '介護保険（要支援）') {
                    requiredFields.push({ name: 'nursingRate', label: '介護保険負担割合' });
                }
            }
        }
        
        for (const field of requiredFields) {
            const element = this.form.querySelector(`[name="${field.name}"]`);
            // 無効化されている項目または非表示の項目はスキップ
            if (!element || element.disabled) {
                continue;
            }
            
            // 親要素が非表示の場合もスキップ
            const parentGroup = element.closest('.form-group');
            if (parentGroup && (parentGroup.style.display === 'none' || 
                               getComputedStyle(parentGroup).display === 'none')) {
                continue;
            }
            
            if (!element.value.trim()) {
                missingFields.push(field.label);
            }
        }
        

        

        if (missingFields.length > 0) {
            const message = `以下の項目を入力してください：\n\n${missingFields.map(field => `・ ${field}`).join('\n')}`;

            this.showError(message);
            return false;
        }
        

        return true;
    }

    displayServiceBreakdown(calculation) {
        // 訪問診療と訪問看護の合計を計算
        let homeMedicalTotal = 0;
        let homeNursingTotal = 0;
        
        // 訪問診療のカテゴリ
        const medicalCategories = ['medical', 'visit', 'nursing', 'transport'];
        // 訪問看護のカテゴリ
        const nursingCategories = ['nursingBasic', 'nursingManagement', 'nursingAddition', 'nursingTransport'];
        
        // 訪問診療セクション（常に表示、ただし無効化されている場合は注記）
        if (calculation.serviceType === 'home-medical' || calculation.serviceType === 'both' || 
            (calculation.categories.medical && Object.keys(calculation.categories).some(key => key.startsWith('medical') || key === 'visit' || key === 'nursing' || key === 'transport'))) {
            // セクション区切り線を追加
            const separatorDiv = document.createElement('div');
            separatorDiv.innerHTML = '<hr style="margin: 30px 0 20px 0; border: 2px solid #e9ecef; border-radius: 2px;">';
            this.breakdownContainer.appendChild(separatorDiv);
            
            // 訪問診療のタイトル
            const medicalSectionDiv = document.createElement('div');
            medicalSectionDiv.className = 'service-section medical-section';
            medicalSectionDiv.innerHTML = '<h3><i class="fas fa-stethoscope"></i> 訪問診療</h3>';
            this.breakdownContainer.appendChild(medicalSectionDiv);
            
            medicalCategories.forEach(categoryKey => {
                const category = calculation.categories[categoryKey];
                if (category && ((category.originalAmount && category.originalAmount > 0) || category.subtotal > 0 || category.items.length > 0)) {
                    this.displayCategory(category);
                    homeMedicalTotal += category.subtotal || 0;
                }
            });
            
            // 訪問診療小計
            if (homeMedicalTotal > 0) {
                const medicalSubtotalDiv = document.createElement('div');
                medicalSubtotalDiv.className = 'service-subtotal';
                medicalSubtotalDiv.innerHTML = `<div style="text-align: right; margin: 10px 0; padding: 12px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; border-radius: 8px;"><strong style="color: #1e40af;">訪問診療小計: ¥${homeMedicalTotal.toLocaleString()}</strong></div>`;
                this.breakdownContainer.appendChild(medicalSubtotalDiv);
            }
        }
        
        // 訪問看護セクション（常に表示、ただし無効化されている場合は注記）
        if (calculation.serviceType === 'home-nursing' || calculation.serviceType === 'both' || 
            (calculation.categories.nursingBasic && Object.keys(calculation.categories).some(key => key.startsWith('nursing')))) {
            // セクション区切り線を追加
            const separatorDiv = document.createElement('div');
            separatorDiv.innerHTML = '<hr style="margin: 30px 0 20px 0; border: 2px solid #e9ecef; border-radius: 2px;">';
            this.breakdownContainer.appendChild(separatorDiv);
            
            // 訪問看護のタイトル
            const nursingSectionDiv = document.createElement('div');
            nursingSectionDiv.className = 'service-section nursing-section';
            nursingSectionDiv.innerHTML = '<h3><i class="fas fa-user-nurse"></i> 訪問看護</h3>';
            this.breakdownContainer.appendChild(nursingSectionDiv);
            
            nursingCategories.forEach(categoryKey => {
                const category = calculation.categories[categoryKey];
                if (category && ((category.originalAmount && category.originalAmount > 0) || category.subtotal > 0 || category.items.length > 0)) {
                    this.displayCategory(category);
                    homeNursingTotal += category.subtotal || 0;
                }
            });
            
            // 訪問看護小計
            if (homeNursingTotal > 0) {
                const nursingSubtotalDiv = document.createElement('div');
                nursingSubtotalDiv.className = 'service-subtotal';
                nursingSubtotalDiv.innerHTML = `<div style="text-align: right; margin: 10px 0; padding: 12px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-left: 4px solid #ec4899; border-radius: 8px;"><strong style="color: #be185d;">訪問看護小計: ¥${homeNursingTotal.toLocaleString()}</strong></div>`;
                this.breakdownContainer.appendChild(nursingSubtotalDiv);
            }
        }
        
        // 3区分合計表示
        if ((homeMedicalTotal >= 0 || homeNursingTotal >= 0) && 
            (Object.keys(calculation.categories).some(key => key.startsWith('medical') || key === 'visit' || key === 'nursing' || key === 'transport') ||
             Object.keys(calculation.categories).some(key => key.startsWith('nursing')))) {
            
            // 3区分の金額を計算
            let medicalInsuranceTotal = 0;  // 医療保険分
            let careInsuranceTotal = 0;     // 介護保険分
            let selfPayTotal = 0;           // 自費分
            
            // 訪問診療の分類（すべて医療保険または自費）
            if (calculation.categories.medical) medicalInsuranceTotal += calculation.categories.medical.subtotal || 0;
            if (calculation.categories.visit) medicalInsuranceTotal += calculation.categories.visit.subtotal || 0;
            if (calculation.categories.nursing) careInsuranceTotal += calculation.categories.nursing.subtotal || 0;
            if (calculation.categories.transport) selfPayTotal += calculation.categories.transport.subtotal || 0;
            
            // 訪問看護の分類
            if (calculation.categories.nursingBasic) {
                const data = this.getFormData(); // 現在のフォームデータを取得
                if (data.nursingPatientType === '医療保険' || data.nursingPatientType === '在宅がん医療総合診療料') {
                    medicalInsuranceTotal += calculation.categories.nursingBasic.subtotal || 0;
                } else {
                    careInsuranceTotal += calculation.categories.nursingBasic.subtotal || 0;
                }
            }
            if (calculation.categories.nursingManagement) {
                const data = this.getFormData(); 
                if (data.nursingPatientType === '医療保険' || data.nursingPatientType === '在宅がん医療総合診療料') {
                    medicalInsuranceTotal += calculation.categories.nursingManagement.subtotal || 0;
                } else {
                    careInsuranceTotal += calculation.categories.nursingManagement.subtotal || 0;
                }
            }
            if (calculation.categories.nursingAddition) {
                const data = this.getFormData(); 
                if (data.nursingPatientType === '医療保険' || data.nursingPatientType === '在宅がん医療総合診療料') {
                    medicalInsuranceTotal += calculation.categories.nursingAddition.subtotal || 0;
                } else {
                    careInsuranceTotal += calculation.categories.nursingAddition.subtotal || 0;
                }
            }
            if (calculation.categories.nursingTransport) selfPayTotal += calculation.categories.nursingTransport.subtotal || 0;
            
            // 高額療養費制度適用後の医療保険分を計算
            let finalMedicalInsuranceTotal = medicalInsuranceTotal;
            let highCostLimitText = '';
            
            if (calculation.insuranceInfo && calculation.insuranceInfo.hasHighCostLimit) {
                finalMedicalInsuranceTotal = calculation.insuranceInfo.medicalBurden || medicalInsuranceTotal;
                highCostLimitText = `（高額療養費制度適用・上限額${calculation.insuranceInfo.highCostLimit?.toLocaleString() || ''}円）`;
            }
            
            // 最終合計区切り線
            const finalSeparatorDiv = document.createElement('div');
            finalSeparatorDiv.innerHTML = '<hr style="margin: 40px 0 25px 0; border: 3px solid #6c757d; border-radius: 3px;">';
            this.breakdownContainer.appendChild(finalSeparatorDiv);
            
            const totalDiv = document.createElement('div');
            totalDiv.className = 'services-total';
            totalDiv.innerHTML = `
                <div>
                    <h4>月額利用料金内訳</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px 0; border-bottom: 1px dotted #6c757d;">
                        <span style="color: #2563eb; font-weight: 600;"><i class="fas fa-heart-pulse" style="margin-right: 8px;"></i>1. 医療費${highCostLimitText}:</span>
                        <span style="color: #2563eb; font-weight: 700;">¥${finalMedicalInsuranceTotal.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px 0; border-bottom: 1px dotted #6c757d;">
                        <span style="color: #16a34a; font-weight: 600;"><i class="fas fa-hands-helping" style="margin-right: 8px;"></i>2. 介護保険費:</span>
                        <span style="color: #16a34a; font-weight: 700;">¥${careInsuranceTotal.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px 0; border-bottom: 1px dotted #6c757d;">
                        <span style="color: #dc2626; font-weight: 600;"><i class="fas fa-wallet" style="margin-right: 8px;"></i>3. 自費:</span>
                        <span style="color: #dc2626; font-weight: 700;">¥${selfPayTotal.toLocaleString()}</span>
                    </div>
                    <hr>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2em; font-weight: bold; color: #1f2937; margin-top: 10px;">
                        <span><i class="fas fa-calculator" style="margin-right: 8px;"></i>合計:</span>
                        <span style="color: #059669;">¥${(finalMedicalInsuranceTotal + careInsuranceTotal + selfPayTotal).toLocaleString()}</span>
                    </div>
                </div>
            `;
            this.breakdownContainer.appendChild(totalDiv);
        }
    }

    displayCategory(category) {
        // カテゴリーヘッダー
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        let headerContent = `<h5>${category.name || ''}</h5>`;
        const originalAmount = category.originalAmount || 0;
        const subtotal = category.subtotal || 0;
        
        if (originalAmount > 0) {
            // 保険適用ありの場合
            headerContent += `<div class="insurance-info">`;
            headerContent += `<small>保険適用前: ¥${isNaN(originalAmount) ? '0' : originalAmount.toLocaleString()}</small>`;
            headerContent += `<span class="category-total">自己負担: ¥${isNaN(subtotal) ? '0' : subtotal.toLocaleString()}</span>`;
            headerContent += `</div>`;
        } else {
            // 保険適用なし（自費）
            headerContent += `<span class="category-total">¥${isNaN(subtotal) ? '0' : subtotal.toLocaleString()}</span>`;
        }
        
        // 在がん患者の基本療養費の場合、包括算定の注釈を表示
        if (category.note) {
            headerContent += `<div class="note-info"><small>${category.note}</small></div>`;
        }
        
        categoryHeader.innerHTML = headerContent;
        this.breakdownContainer.appendChild(categoryHeader);
        
        // カテゴリー内訳
        category.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'breakdown-item category-item';
            
            const itemAmount = item.amount || 0;
            itemDiv.innerHTML = `
                <div class="breakdown-name">
                    <strong>${item.name || ''}</strong>
                    <small>${item.detail || ''}</small>
                </div>
                <div class="breakdown-amount">
                    ¥${isNaN(itemAmount) ? '0' : itemAmount.toLocaleString()}
                </div>
            `;
            this.breakdownContainer.appendChild(itemDiv);
        });
    }

    getServiceTypeLabel(serviceType) {
        switch (serviceType) {
            case 'home-medical':
                return '訪問診療';
            case 'home-nursing':
                return '訪問看護';
            case 'both':
                return '訪問診療 + 訪問看護';
            default:
                return '';
        }
    }

    showLoading(show) {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = show ? 'flex' : 'none';
        } else {
            console.warn('Loading spinner not found');
        }
    }

    showError(message) {
        alert(message);
    }

    scrollToResult() {
        this.resultSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    handlePrint() {
        // 印刷用のデータを準備
        const printData = this.preparePrintData();
        if (!printData) {
            this.showError('印刷するデータがありません。先に料金計算を行ってください。');
            return;
        }

        // 印刷用ウィンドウを開く
        const printWindow = window.open('', '_blank');
        const printContent = this.generatePrintContent(printData);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // 印刷ダイアログを表示
        printWindow.onload = () => {
            printWindow.print();
            // 印刷完了後にウィンドウを閉じる
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        };
    }

    initializeServiceTabs() {
        // すべてのタブボタンにイベントリスナーを追加
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick.bind(this));
        });
        
        // 初期状態の同期（チェックボックス状態をタブに反映）
        this.syncTabStatesWithCheckboxes();
    }

    syncTabStatesWithCheckboxes() {
        // 訪問診療のタブ同期
        const homeMedicalCheckbox = document.getElementById('disableHomeMedical');
        if (homeMedicalCheckbox) {
            const homeMedicalTabs = document.querySelectorAll('[data-service="home-medical"]');
            const isDisabled = homeMedicalCheckbox.checked;
            homeMedicalTabs.forEach(tab => {
                tab.classList.remove('active');
                if ((tab.getAttribute('data-state') === 'disabled') === isDisabled) {
                    tab.classList.add('active');
                }
            });
        }
        
        // 訪問看護のタブ同期
        const homeNursingCheckbox = document.getElementById('disableHomeNursing');
        if (homeNursingCheckbox) {
            const homeNursingTabs = document.querySelectorAll('[data-service="home-nursing"]');
            const isDisabled = homeNursingCheckbox.checked;
            homeNursingTabs.forEach(tab => {
                tab.classList.remove('active');
                if ((tab.getAttribute('data-state') === 'disabled') === isDisabled) {
                    tab.classList.add('active');
                }
            });
        }
    }

    handleTabClick(event) {
        const button = event.target;
        const service = button.getAttribute('data-service');
        const state = button.getAttribute('data-state');
        
        // 同じサービスの他のタブを非アクティブにする
        const siblingTabs = button.parentNode.querySelectorAll('.tab-button');
        siblingTabs.forEach(tab => tab.classList.remove('active'));
        
        // クリックしたタブをアクティブにする
        button.classList.add('active');
        
        // 対応するチェックボックスの状態を更新
        const isDisabled = state === 'disabled';
        if (service === 'home-medical') {
            const checkbox = document.getElementById('disableHomeMedical');
            if (checkbox) {
                checkbox.checked = isDisabled;
                // チェックボックスのchangeイベントを発火させて既存の処理を実行
                checkbox.dispatchEvent(new Event('change'));
            }
        } else if (service === 'home-nursing') {
            const checkbox = document.getElementById('disableHomeNursing');
            if (checkbox) {
                checkbox.checked = isDisabled;
                // チェックボックスのchangeイベントを発火させて既存の処理を実行
                checkbox.dispatchEvent(new Event('change'));
            }
        }
        
        // 結果セクションを隠す
        this.resultSection.style.display = 'none';
        if (this.comparisonSection) {
            this.comparisonSection.style.display = 'none';
        }
    }

    preparePrintData() {
        // 現在の計算結果があるかチェック
        if (this.resultSection.style.display === 'none') {
            return null;
        }

        // フォームデータを取得
        const formData = this.getFormData();
        
        // 計算結果の要素から情報を抽出
        const totalAmount = this.totalAmountDisplay.textContent;
        const breakdown = this.breakdownContainer.innerHTML;
        
        return {
            formData: formData,
            totalAmount: totalAmount,
            breakdown: breakdown,
            calculationDate: new Date().toLocaleString('ja-JP')
        };
    }

    generatePrintContent(data) {
        const { formData, totalAmount, breakdown, calculationDate } = data;
        
        // 訪問診療と訪問看護の背景色を分ける
        let modifiedBreakdown = breakdown;
        
        // 訪問診療のセクションヘッダーを検出してクラスを追加
        modifiedBreakdown = modifiedBreakdown.replace(
            /<h3><i class="fas fa-stethoscope"><\/i> 訪問診療<\/h3>/g,
            '<h3 class="medical-section-header"><i class="fas fa-stethoscope"></i> 訪問診療</h3>'
        );
        
        // 訪問看護のセクションヘッダーを検出してクラスを追加
        modifiedBreakdown = modifiedBreakdown.replace(
            /<h3><i class="fas fa-user-nurse"><\/i> 訪問看護<\/h3>/g,
            '<h3 class="nursing-section-header"><i class="fas fa-user-nurse"></i> 訪問看護</h3>'
        );
        
        // 訪問診療セクションと訪問看護セクションの範囲を特定
        const medicalStartIndex = modifiedBreakdown.indexOf('<h3 class="medical-section-header">');
        const nursingStartIndex = modifiedBreakdown.indexOf('<h3 class="nursing-section-header">');
        
        if (medicalStartIndex !== -1 && nursingStartIndex !== -1) {
            // 両方のセクションが存在する場合
            const beforeMedical = modifiedBreakdown.substring(0, medicalStartIndex);
            const medicalSection = modifiedBreakdown.substring(medicalStartIndex, nursingStartIndex);
            let nursingSection = modifiedBreakdown.substring(nursingStartIndex);
            
            // 訪問診療セクションを青色に
            const modifiedMedicalSection = medicalSection.replace(
                /<div class="category-header">/g,
                '<div class="category-header medical-category">'
            ).replace(
                /<div class="breakdown-item category-item">/g,
                '<div class="breakdown-item category-item medical-category">'
            );
            
            // 訪問看護セクションをピンク色に
            nursingSection = nursingSection.replace(
                /<div class="category-header">/g,
                '<div class="category-header nursing-category">'
            ).replace(
                /<div class="breakdown-item category-item">/g,
                '<div class="breakdown-item category-item nursing-category">'
            );
            
            // 結合
            modifiedBreakdown = beforeMedical + modifiedMedicalSection + nursingSection;
            
        } else if (nursingStartIndex !== -1) {
            // 訪問看護セクションのみ存在する場合
            const beforeNursing = modifiedBreakdown.substring(0, nursingStartIndex);
            let afterNursing = modifiedBreakdown.substring(nursingStartIndex);
            
            // 訪問看護セクション内をピンク色に
            afterNursing = afterNursing.replace(
                /<div class="category-header">/g,
                '<div class="category-header nursing-category">'
            ).replace(
                /<div class="breakdown-item category-item">/g,
                '<div class="breakdown-item category-item nursing-category">'
            );
            
            // 結合
            modifiedBreakdown = beforeNursing + afterNursing;
            
        } else {
            // フォールバック: キーワードベースで分類
            // 訪問診療関連のカテゴリーヘッダーを青色に
            modifiedBreakdown = modifiedBreakdown.replace(
                /<div class="category-header">[\s\S]*?<h5>.*?(在総管|在宅患者訪問診療料|介護保険.*居宅療養管理指導|交通費).*?<\/h5>[\s\S]*?<\/div>/g,
                (match) => {
                    return match.replace('class="category-header"', 'class="category-header medical-category"');
                }
            );
            
            // 訪問診療関連のbreakdown-itemを青色に
            modifiedBreakdown = modifiedBreakdown.replace(
                /<div class="breakdown-item category-item">[\s\S]*?<strong>.*?(在宅時医学総合管理料|在宅患者訪問診療料|居宅療養管理指導|交通費).*?<\/strong>[\s\S]*?<\/div>/g,
                (match) => {
                    return match.replace('class="breakdown-item category-item"', 'class="breakdown-item category-item medical-category"');
                }
            );
            
            // 訪問看護関連のカテゴリーヘッダーをピンク色に
            modifiedBreakdown = modifiedBreakdown.replace(
                /<div class="category-header">[\s\S]*?<h5>.*?(訪問看護|基本療養費|管理療養費|加算|リハビリ|自費).*?<\/h5>[\s\S]*?<\/div>/g,
                (match) => {
                    return match.replace('class="category-header"', 'class="category-header nursing-category"');
                }
            );
            
            // 訪問看護関連のbreakdown-itemをピンク色に
            modifiedBreakdown = modifiedBreakdown.replace(
                /<div class="breakdown-item category-item">[\s\S]*?<strong>.*?(基本療養費|管理療養費|医療保険加算|介護保険加算|自費|訪問看護|リハビリ).*?<\/strong>[\s\S]*?<\/div>/g,
                (match) => {
                    return match.replace('class="breakdown-item category-item"', 'class="breakdown-item category-item nursing-category"');
                }
            );
        }
        
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.getServiceTypeLabel(formData.serviceType || 'home-medical')}費用計算結果 - 新生病院</title>
    <style>
        /* 印刷用CSS - A4用紙1枚対応 */
        @page {
            size: A4;
            margin: 12mm 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'ヒラギノ角ゴシック', sans-serif;
            font-size: 8pt;
            line-height: 1.1;
            color: #333;
            background: white;
        }
        
        .print-header {
            text-align: center;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 6pt;
            margin-bottom: 8pt;
        }
        
        .print-header h1 {
            font-size: 14pt;
            color: #2c3e50;
            margin-bottom: 2pt;
        }
        
        .print-header p {
            font-size: 10pt;
            color: #666;
        }
        
        .calculation-info {
            margin-bottom: 6pt;
            padding: 4pt 8pt;
            background: #f8f9fa;
            border-left: 2px solid #4CAF50;
            border-radius: 3pt;
        }
        
        .info-grid-compact {
            display: flex;
            flex-wrap: wrap;
            gap: 8pt 15pt;
            font-size: 7pt;
            justify-content: space-between;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 4pt;
            white-space: nowrap;
        }
        
        .info-item span {
            color: #666;
            font-size: 7pt;
        }
        
        .info-item strong {
            color: #333;
            font-size: 7pt;
            font-weight: 600;
        }
        
        .total-amount {
            text-align: center;
            margin: 6pt 0;
            padding: 6pt;
            background: #e8f5e8;
            border-radius: 4pt;
        }
        
        .total-amount h2 {
            font-size: 10pt;
            color: #2c3e50;
            margin-bottom: 3pt;
        }
        
        .total-amount .amount {
            font-size: 16pt;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .breakdown-section {
            margin: 6pt 0;
        }
        
        .breakdown-section h3 {
            font-size: 10pt;
            color: #2c3e50;
            margin-bottom: 4pt;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2pt;
        }
        
        /* 内訳表示の調整 - さらにコンパクト化 */
        .result-info,
        .category-header,
        .breakdown-item,
        .insurance-summary {
            margin-bottom: 2pt !important;
            padding: 2pt 4pt !important;
            border-radius: 2pt !important;
            font-size: 7pt !important;
            line-height: 1.0 !important;
        }
        
        .category-header {
            background: #f0f8ff !important;
            border-left: 2px solid #007bff !important;
            font-weight: bold;
        }
        
        /* 訪問診療の内訳項目を青色背景で統一 */
        .medical-category.category-header,
        .medical-category {
            background: linear-gradient(135deg, #e0f2fe, #e1f5fe) !important;
            border-left: 2px solid #1976d2 !important;
        }
        
        .breakdown-item.medical-category {
            background: linear-gradient(135deg, #f3f8ff, #f0f8ff) !important;
            border-left: 1px solid #1976d2 !important;
        }
        
        .medical-section-header {
            background: linear-gradient(135deg, #e0f2fe, #e1f5fe) !important;
            border-left: 4px solid #1976d2 !important;
            color: #1565c0 !important;
        }
        
        /* 訪問看護の内訳項目をピンク色背景で統一 */
        .nursing-category.category-header,
        .nursing-category {
            background: linear-gradient(135deg, #fce7f3, #fdf2f8) !important;
            border-left: 2px solid #ec4899 !important;
        }
        
        .breakdown-item.nursing-category {
            background: linear-gradient(135deg, #fef7ff, #fdf4ff) !important;
            border-left: 1px solid #ec4899 !important;
        }
        
        .nursing-section-header {
            background: linear-gradient(135deg, #fce7f3, #fdf2f8) !important;
            border-left: 4px solid #ec4899 !important;
            color: #be185d !important;
        }
        
        .category-header h5 {
            font-size: 9pt !important;
            margin: 0 !important;
        }
        
        .breakdown-item {
            background: #fdfdfd !important;
            border-left: 1px solid #e9ecef !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
        }
        
        .breakdown-name {
            flex: 1;
            margin-right: 8pt;
        }
        
        .breakdown-name strong {
            font-size: 8pt !important;
            display: block;
        }
        
        .breakdown-name small {
            font-size: 7pt !important;
            color: #666 !important;
            display: block;
            margin-top: 1pt;
        }
        
        .breakdown-amount {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
        }
        
        .insurance-summary {
            background: #e8f4fd !important;
            border-left: 2px solid #007bff !important;
        }
        
        .insurance-summary h5 {
            font-size: 9pt !important;
            margin: 0 0 2pt 0 !important;
        }
        
        .insurance-breakdown {
            display: flex !important;
            flex-direction: column !important;
            gap: 1pt !important;
        }
        
        .insurance-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 7pt !important;
            padding: 1pt 0 !important;
        }
        
        .insurance-item.highlight {
            background: #fff3cd !important;
            border: 1px solid #ffeaa7 !important;
            padding: 2pt !important;
            margin: 1pt 0 !important;
            border-radius: 2pt !important;
        }
        
        .insurance-item span:first-child {
            font-weight: 500;
            color: #495057;
            flex: 1;
            margin-right: 4pt;
        }
        
        .insurance-item span:last-child {
            font-weight: 600;
            color: #007bff;
            text-align: right;
            white-space: nowrap;
        }
        
        .disclaimer {
            margin-top: 8pt;
            padding: 4pt;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 2pt;
            font-size: 7pt;
            line-height: 1.2;
        }
        
        .print-footer {
            position: fixed;
            bottom: 8mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 3pt;
        }
        
        /* 印刷時のスタイル調整 */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            .breakdown-item {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>在宅医療 費用概算シミュレーター結果</h1>
        <p>特定医療法人　新生病院</p>
    </div>
    
    <div class="calculation-info">
        <div class="info-grid-compact">
            <div class="info-item">
                <span>ご利用サービス:</span>
                <strong>${this.getServiceTypeLabel(formData.serviceType || 'home-medical')}</strong>
            </div>
            <div class="info-item">
                <span>医療保険負担:</span>
                <strong>${Math.floor((formData.insuranceRate || 0) / 10)}割</strong>
            </div>
            <div class="info-item">
                <span>介護保険負担:</span>
                <strong>${Math.floor((formData.nursingRate || 0) / 10)}割</strong>
            </div>
            ${(formData.serviceType === 'home-medical' || formData.serviceType === 'both') ? `
            <div class="info-item">
                <span>患者タイプ:</span>
                <strong>${formData.patientType || '未設定'}</strong>
            </div>
            <div class="info-item">
                <span>月間訪問:</span>
                <strong>${formData.monthlyVisits || 0}日</strong>
            </div>` : ''}
            <div class="info-item">
                <span>距離:</span>
                <strong>${formData.distance || 0}km</strong>
            </div>
        </div>
    </div>
    
    <div class="total-amount">
        <h2>月額自己負担額</h2>
        <div class="amount">¥${totalAmount}</div>
    </div>
    
    <div class="breakdown-section">
        <h3>計算内訳</h3>
        <div class="breakdown-content">
            ${modifiedBreakdown}
        </div>
    </div>
    
    <div class="disclaimer">
        <strong>ご注意：</strong>この料金は2024年度診療報酬改定に基づく概算です。実際の料金は個別の診療内容や保険適用状況により変動する場合があります。詳細については新生病院までお問い合わせください。
    </div>
    
    <div class="print-footer">
        計算日時: ${calculationDate} | 特定医療法人　新生病院　在宅医療 費用概算シミュレーター
    </div>
</body>
</html>`;
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new MedicalFeeCalculator();
});

// エクスポート（テスト用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalFeeCalculator;
}
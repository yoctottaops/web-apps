/*
 *
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
*/
/**
 *  ShapeSettings.js
 *
 *  Created by Julia Radzhabova on 3/28/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!spreadsheeteditor/main/app/template/ShapeSettings.template',
    'jquery',
    'underscore',
    'backbone',
    'common/main/lib/component/ComboBox',
    'common/main/lib/component/ComboBorderSize',
    'common/main/lib/component/MetricSpinner',
    'common/main/lib/component/ThemeColorPalette',
    'common/main/lib/component/ColorButton',
    'common/main/lib/component/ComboDataView',
    'common/main/lib/component/Slider',
    'common/main/lib/component/MultiSliderGradient',
    'common/main/lib/view/ImageFromUrlDialog',
    'spreadsheeteditor/main/app/view/ShapeSettingsAdvanced'
], function (menuTemplate, $, _, Backbone) {
    'use strict';

    SSE.Views.ShapeSettings = Backbone.View.extend(_.extend({
        el: '#id-shape-settings',

        // Compile our stats template
        template: _.template(menuTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
        },

        options: {
            alias: 'ShapeSettings'
        },

        initialize: function () {
            this._initSettings = true;
            this._originalProps = null;
            this._noApply = true;
            this.imgprops = null;
            this._sendUndoPoint = true;
            this._sliderChanged = false;
            this._texturearray = null;

            this.txtPt = Common.Utils.Metric.getMetricName(Common.Utils.Metric.c_MetricUnits.pt);

            this._state = {
                Transparency: null,
                FillType: Asc.c_oAscFill.FILL_TYPE_SOLID,
                ShapeColor: 'transparent',
                BlipFillType: Asc.c_oAscFillBlipType.STRETCH,
                StrokeType: Asc.c_oAscStrokeType.STROKE_COLOR,
                StrokeWidth: this._pt2mm(1),
                StrokeColor: '000000',
                StrokeBorderType: Asc.c_oDashType.solid,
                FGColor: '000000',
                BGColor: 'ffffff',
                GradColor: '000000',
                GradFillType: Asc.c_oAscFillGradType.GRAD_LINEAR,
                DisabledFillPanels: false,
                DisabledControls: false,
                HideShapeOnlySettings: false,
                HideChangeTypeSettings: false,
                isFromImage: false
            };
            this.lockedControls = [];
            this._locked = false;

            this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_SOLID;
            this.ShapeColor = {Value: 1, Color: 'transparent'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным
            this.BlipFillType = Asc.c_oAscFillBlipType.STRETCH;
            this.GradFillType = Asc.c_oAscFillGradType.GRAD_LINEAR;
            this.GradColor = { values: [0, 100], colors: ['000000', 'ffffff'], currentIdx: 0};
            this.GradRadialDirectionIdx = 0;
            this.GradLinearDirectionType = 0;
            this.PatternFillType = 0;
            this.FGColor = {Value: 1, Color: '000000'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным
            this.BGColor = {Value: 1, Color: 'ffffff'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным

            this.BorderColor = {Value: 1, Color: 'transparent'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным
            this.BorderSize = 0;
            this.BorderType = Asc.c_oDashType.solid;

            this.textureNames = [this.txtCanvas, this.txtCarton, this.txtDarkFabric, this.txtGrain, this.txtGranite, this.txtGreyPaper,
                this.txtKnit, this.txtLeather, this.txtBrownPaper, this.txtPapyrus, this.txtWood];

            this.fillControls = [];

            this.render();

            this.FillColorContainer = $('#shape-panel-color-fill');
            this.FillImageContainer = $('#shape-panel-image-fill');
            this.FillPatternContainer = $('#shape-panel-pattern-fill');
            this.FillGradientContainer = $('#shape-panel-gradient-fill');
            this.TransparencyContainer = $('#shape-panel-transparent-fill');
            this.ShapeOnlySettings = $('.shape-only');
            this.CanChangeType = $('.change-type');
        },

        render: function () {
            var el = $(this.el);
            el.html(this.template({
                scope: this
            }));
        },

        setApi: function(api) {
            this.api = api;
            if (this.api) {
                this.api.asc_setInterfaceDrawImagePlaceShape('shape-texture-img');
                this.api.asc_registerCallback('asc_onInitStandartTextures', _.bind(this.onInitStandartTextures, this));
            }
            return this;
        },

        onFillSrcSelect: function(combo, record) {
            this.ShowHideElem(record.value);
            switch (record.value){
                case Asc.c_oAscFill.FILL_TYPE_SOLID:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_SOLID;
                    if (!this._noApply) {
                        var props = new Asc.asc_CShapeProperty();
                        var fill = new Asc.asc_CShapeFill();
                        fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_SOLID);
                        fill.asc_putFill( new Asc.asc_CFillSolid());
                        fill.asc_getFill().asc_putColor(Common.Utils.ThemeColor.getRgbColor((this.ShapeColor.Color=='transparent') ? {color: '4f81bd', effectId: 24} : this.ShapeColor.Color));
                        props.asc_putFill(fill);
                        this.imgprops.asc_putShapeProperties(props);
                        this.api.asc_setGraphicObjectProps(this.imgprops);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_GRAD:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_GRAD;
                    if (!this._noApply) {
                        var props = new Asc.asc_CShapeProperty();
                        var fill = new Asc.asc_CShapeFill();
                        fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_GRAD);
                        fill.asc_putFill( new Asc.asc_CFillGrad());
                        fill.asc_getFill().asc_putGradType(this.GradFillType);
                        if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                            fill.asc_getFill().asc_putLinearAngle(this.GradLinearDirectionType * 60000);
                            fill.asc_getFill().asc_putLinearScale(true);
                        }
                        if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_GRAD) {
                            this.GradColor.values = [0, 100];
                            this.GradColor.colors = [this.GradColor.colors[0], this.GradColor.colors[this.GradColor.colors.length - 1]];
                            this.GradColor.currentIdx = 0;
                            var HexColor0 = Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[0]).get_color().get_hex(),
                                HexColor1 = Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[1]).get_color().get_hex();

                            if (HexColor0 === 'ffffff' && HexColor1 === 'ffffff') {
                                HexColor0 = {color: '4f81bd', effectId: 24};    // color accent1
                            } else {
                                HexColor0 = this.GradColor.colors[0];
                            }

                            fill.asc_getFill().asc_putPositions([this.GradColor.values[0]*1000, this.GradColor.values[1]*1000]);
                            fill.asc_getFill().asc_putColors([Common.Utils.ThemeColor.getRgbColor(HexColor0), Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[1])]);
                        }
                        props.asc_putFill(fill);
                        this.imgprops.asc_putShapeProperties(props);
                        this.api.asc_setGraphicObjectProps(this.imgprops);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_BLIP:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_BLIP;
                    break;
                case Asc.c_oAscFill.FILL_TYPE_PATT:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_PATT;
                    if (!this._noApply) {
                        var props = new Asc.asc_CShapeProperty();
                        var fill = new Asc.asc_CShapeFill();
                        fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_PATT);
                        fill.asc_putFill( new Asc.asc_CFillHatch());
                        fill.asc_getFill().asc_putPatternType(this.PatternFillType);

                        var fHexColor = Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color).get_color().get_hex();
                        var bHexColor = Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color).get_color().get_hex();

                        if (bHexColor === 'ffffff' && fHexColor === 'ffffff') {
                            fHexColor = {color: '4f81bd', effectId: 24};    // color accent1
                        } else {
                            fHexColor = this.FGColor.Color;
                        }

                        fill.asc_getFill().asc_putColorFg(Common.Utils.ThemeColor.getRgbColor(fHexColor));
                        fill.asc_getFill().asc_putColorBg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));

                        props.asc_putFill(fill);
                        this.imgprops.asc_putShapeProperties(props);
                        this.api.asc_setGraphicObjectProps(this.imgprops);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_NOFILL:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_NOFILL;
                    if (!this._noApply) {
                        var props = new Asc.asc_CShapeProperty();
                        var fill = new Asc.asc_CShapeFill();
                        fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_NOFILL);
                        fill.asc_putFill(null);
                        props.asc_putFill(fill);
                        this.imgprops.asc_putShapeProperties(props);
                        this.api.asc_setGraphicObjectProps(this.imgprops);
                    }
                    break;
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onColorsBackSelect: function(btn, color) {
            this.ShapeColor = {Value: 1, Color: color};

            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();

                if (this.ShapeColor.Color=='transparent') {
                    fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_NOFILL);
                    fill.asc_putFill(null);
                } else {
                    fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_SOLID);
                    fill.asc_putFill( new Asc.asc_CFillSolid());
                    fill.asc_getFill().asc_putColor(Common.Utils.ThemeColor.getRgbColor(this.ShapeColor.Color));
                }

                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onPatternSelect: function(combo, record){
            if (this.api && !this._noApply) {
                this.PatternFillType = record.get('type');
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.asc_putFill( new Asc.asc_CFillHatch());
                fill.asc_getFill().asc_putPatternType(this.PatternFillType);
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.asc_getFill().asc_putColorFg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                    fill.asc_getFill().asc_putColorBg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                }
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onColorsFGSelect: function(btn, color) {
            this.FGColor = {Value: 1, Color: color};
            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.asc_putFill( new Asc.asc_CFillHatch());
                fill.asc_getFill().asc_putColorFg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.asc_getFill().asc_putPatternType(this.PatternFillType);
                    fill.asc_getFill().asc_putColorBg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                }
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onColorsBGSelect: function(btn, color) {
            this.BGColor = {Value: 1, Color: color};
            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.asc_putFill( new Asc.asc_CFillHatch());
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.asc_getFill().asc_putPatternType(this.PatternFillType);
                    fill.asc_getFill().asc_putColorFg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                }
                fill.asc_getFill().asc_putColorBg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onFillTypeSelect: function(combo, record) {
            this.BlipFillType = record.value;

            if (this.api && this._fromTextureCmb !== true && this.OriginalFillType == Asc.c_oAscFill.FILL_TYPE_BLIP) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_BLIP);
                fill.asc_putFill( new Asc.asc_CFillBlip());

                fill.asc_getFill().asc_putType(this.BlipFillType);

                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onNumTransparencyChange: function(field, newValue, oldValue, eOpts){
            this.sldrTransparency.setValue(field.getNumberValue(), true);
            if (this.api)  {
                var num = field.getNumberValue();
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putTransparent(num * 2.55);
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
        },

        onTransparencyChange: function(field, newValue, oldValue){
            this._sliderChanged = newValue;
            this.numTransparency.setValue(newValue, true);

            if (this._sendUndoPoint) {
                this.api.setStartPointHistory();
                this._sendUndoPoint = false;
                this.updateslider = setInterval(_.bind(this._transparencyApplyFunc, this), 100);
            }
        },

        onTransparencyChangeComplete: function(field, newValue, oldValue){
            clearInterval(this.updateslider);
            this._sliderChanged = newValue;
            if (!this._sendUndoPoint) { // start point was added
                this.api.setEndPointHistory();
                this._transparencyApplyFunc();
            }
            this._sendUndoPoint = true;
        },

         _transparencyApplyFunc: function() {
            if (this._sliderChanged!==undefined) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putTransparent(this._sliderChanged * 2.55);
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
                this._sliderChanged = undefined;
            }
        },

        onGradTypeSelect: function(combo, record){
            this.GradFillType = record.value;

            if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                this.mnuDirectionPicker.store.reset(this._viewDataLinear);
                this.mnuDirectionPicker.cmpEl.width(175);
                this.mnuDirectionPicker.restoreHeight = 174;
                var record = this.mnuDirectionPicker.store.findWhere({type: this.GradLinearDirectionType});
                this.mnuDirectionPicker.selectRecord(record, true);
                if (record)
                    this.btnDirection.setIconCls('item-gradient ' + record.get('iconcls'));
                else
                    this.btnDirection.setIconCls('');
            } else if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_PATH) {
                this.mnuDirectionPicker.store.reset(this._viewDataRadial);
                this.mnuDirectionPicker.cmpEl.width(60);
                this.mnuDirectionPicker.restoreHeight = 58;
                this.mnuDirectionPicker.selectByIndex(this.GradRadialDirectionIdx, true);
                if (this.GradRadialDirectionIdx>=0)
                    this.btnDirection.setIconCls('item-gradient ' + this._viewDataRadial[this.GradRadialDirectionIdx].iconcls);
                else
                    this.btnDirection.setIconCls('');
            }

            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.asc_putFill( new Asc.asc_CFillGrad());
                fill.asc_getFill().asc_putGradType(this.GradFillType);
                if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                    fill.asc_getFill().asc_putLinearAngle(this.GradLinearDirectionType * 60000);
                    fill.asc_getFill().asc_putLinearScale(true);
                }
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }

            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onSelectGradient: function(btn, picker, itemView, record) {
            if (this._noApply) return;

            var rawData = {},
                isPickerSelect = _.isFunction(record.toJSON);

            if (isPickerSelect){
                if (record.get('selected')) {
                    rawData = record.toJSON();
                } else {
                    // record deselected
                    return;
                }
            } else {
                rawData = record;
            }

            this.btnDirection.setIconCls('item-gradient ' + rawData.iconcls);
            (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) ? this.GradLinearDirectionType = rawData.type : this.GradRadialDirectionIdx = 0;
            if (this.api) {
                if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                    var props = new Asc.asc_CShapeProperty();
                    var fill = new Asc.asc_CShapeFill();
                    fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_GRAD);
                    fill.asc_putFill( new Asc.asc_CFillGrad());
                    fill.asc_getFill().asc_putGradType(this.GradFillType);
                    fill.asc_getFill().asc_putLinearAngle(rawData.type * 60000);
                    fill.asc_getFill().asc_putLinearScale(true);

                    props.asc_putFill(fill);
                    this.imgprops.asc_putShapeProperties(props);
                    this.api.asc_setGraphicObjectProps(this.imgprops);
                }
            }

            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onColorsGradientSelect: function(btn, color) {
            this.GradColor.colors[this.GradColor.currentIdx] = color;
            this.sldrGradient.setColorValue(Common.Utils.String.format('#{0}', (typeof(color) == 'object') ? color.color : color));

            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.asc_putFill( new Asc.asc_CFillGrad());
                fill.asc_getFill().asc_putGradType(this.GradFillType);
                var arr = [];
                this.GradColor.colors.forEach(function(item){
                    arr.push(Common.Utils.ThemeColor.getRgbColor(item));
                });
                fill.asc_getFill().asc_putColors(arr);

                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_GRAD) {
                    if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                        fill.asc_getFill().asc_putLinearAngle(this.GradLinearDirectionType * 60000);
                        fill.asc_getFill().asc_putLinearScale(true);
                    }
                    arr = [];
                    this.GradColor.values.forEach(function(item){
                        arr.push(item*1000);
                    });
                    fill.asc_getFill().asc_putPositions(arr);
                }
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onGradientChange: function(slider, newValue, oldValue){
            this.GradColor.values = slider.getValues();
            this._sliderChanged = true;
            if (this.api && !this._noApply) {
                if (this._sendUndoPoint)  {
                    this.api.setStartPointHistory();
                    this._sendUndoPoint = false;
                    this.updateslider = setInterval(_.bind(this._gradientApplyFunc, this), 100);
                }
            }
        },

        onGradientChangeComplete: function(slider, newValue, oldValue){
            clearInterval(this.updateslider);
            this._sliderChanged = true;
            if (!this._sendUndoPoint) { // start point was added
                this.api.setEndPointHistory();
                this._gradientApplyFunc();
            }
            this._sendUndoPoint = true;
        },

        _gradientApplyFunc: function() {
            if (this._sliderChanged) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.asc_putFill( new Asc.asc_CFillGrad());
                fill.asc_getFill().asc_putGradType(this.GradFillType);
                var arr = [];
                this.GradColor.values.forEach(function(item){
                    arr.push(item*1000);
                });
                fill.asc_getFill().asc_putPositions(arr);

                if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                    fill.asc_getFill().asc_putLinearAngle(this.GradLinearDirectionType * 60000);
                    fill.asc_getFill().asc_putLinearScale(true);
                }
                arr = [];
                this.GradColor.colors.forEach(function(item){
                    arr.push(Common.Utils.ThemeColor.getRgbColor(item));
                });
                fill.asc_getFill().asc_putColors(arr);

                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
                this._sliderChanged = false;
            }
        },

        applyBorderSize: function(value) {
            value = Common.Utils.String.parseFloat(value);
            value = isNaN(value) ? 0 : Math.max(0, Math.min(1584, value));

            this.BorderSize = value;
            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var stroke = new Asc.asc_CStroke();
                if (this.BorderSize<0.00001) {
                    stroke.asc_putType( Asc.c_oAscStrokeType.STROKE_NONE);
                    this._state.StrokeType = this._state.StrokeWidth = -1;
                } else {
                    stroke.asc_putType( Asc.c_oAscStrokeType.STROKE_COLOR);
                    if (this.BorderColor.Color == 'transparent' || this.BorderColor.Color.color == 'transparent')
                        stroke.asc_putColor(Common.Utils.ThemeColor.getRgbColor({color: '000000', effectId: 29}));
                    else if (this._state.StrokeType == Asc.c_oAscStrokeType.STROKE_NONE || this._state.StrokeType === null)
                        stroke.asc_putColor(Common.Utils.ThemeColor.getRgbColor(Common.Utils.ThemeColor.colorValue2EffectId(this.BorderColor.Color)));
                    stroke.asc_putPrstDash(this.BorderType);
                    stroke.asc_putWidth(this._pt2mm(this.BorderSize));
                }
                props.asc_putStroke(stroke);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
                Common.NotificationCenter.trigger('edit:complete', this);
            }
        },

        onComboBlur: function() {
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onBorderSizeChanged: function(before, combo, record, e) {
            var me = this;
            if (before) {
                var value = parseFloat(record.value),
                    expr = new RegExp('^\\s*(\\d*(\\.|,)?\\d+)\\s*(' + me.txtPt + ')?\\s*$');
                if (!(expr.exec(record.value)) || value<0 || value>1584) {
                    this._state.StrokeType = this._state.StrokeWidth = -1;
                    Common.UI.error({
                        msg: this.textBorderSizeErr,
                        callback: function() {
                            _.defer(function(btn) {
                                Common.NotificationCenter.trigger('edit:complete', me);
                            })
                        }
                    });
                }
            } else
                this.applyBorderSize(record.value);
        },

        onBorderSizeSelect: function(combo, record) {
            this.applyBorderSize(record.value);
        },

        onBorderTypeSelect: function(combo, record) {
            this.BorderType = record.value;
            if (this.api && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var stroke = new Asc.asc_CStroke();
                if (this.BorderSize<0.00001) {
                    stroke.put_type( Asc.c_oAscStrokeType.STROKE_NONE);
                } else {
                    stroke.put_type( Asc.c_oAscStrokeType.STROKE_COLOR);
                    stroke.put_color(Common.Utils.ThemeColor.getRgbColor(this.BorderColor.Color));
                    stroke.put_width(this._pt2mm(this.BorderSize));
                    stroke.asc_putPrstDash(this.BorderType);
                }
                props.put_stroke(stroke);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onColorsBorderSelect: function(btn, color) {
            this.BorderColor = {Value: 1, Color: color};
            if (this.api && this.BorderSize>0 && !this._noApply) {
                var props = new Asc.asc_CShapeProperty();
                var stroke = new Asc.asc_CStroke();
                if (this.BorderSize<0.00001) {
                    stroke.asc_putType( Asc.c_oAscStrokeType.STROKE_NONE);
                } else {
                    stroke.asc_putType( Asc.c_oAscStrokeType.STROKE_COLOR);
                    stroke.asc_putColor(Common.Utils.ThemeColor.getRgbColor(this.BorderColor.Color));
                    stroke.asc_putWidth(this._pt2mm(this.BorderSize));
                    stroke.asc_putPrstDash(this.BorderType);
                }
                props.asc_putStroke(stroke);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        insertFromUrl: function() {
            var me = this;
            (new Common.Views.ImageFromUrlDialog({
                handler: function(result, value) {
                    if (result == 'ok') {
                        if (me.api) {
                            var checkUrl = value.replace(/ /g, '');
                            if (!_.isEmpty(checkUrl)) {
                                if (me.BlipFillType !== null) {
                                    var props = new Asc.asc_CShapeProperty();
                                    var fill = new Asc.asc_CShapeFill();
                                    fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_BLIP);
                                    fill.asc_putFill( new Asc.asc_CFillBlip());
                                    fill.asc_getFill().asc_putType(me.BlipFillType);
                                    fill.asc_getFill().asc_putUrl(checkUrl);

                                    props.asc_putFill(fill);
                                    me.imgprops.asc_putShapeProperties(props);
                                    me.api.asc_setGraphicObjectProps(me.imgprops);
                                }
                            }
                        }
                    }
                    Common.NotificationCenter.trigger('edit:complete', me);
                }
            })).show();
        },

        openAdvancedSettings: function(e) {
            if (this.linkAdvanced.hasClass('disabled')) return;

            var me = this;
            var win;
            if (me.api && !this._locked){
                var selectedElements = me.api.asc_getGraphicObjectProps();
                if (selectedElements && selectedElements.length>0){
                    var elType, elValue;
                    for (var i = selectedElements.length - 1; i >= 0; i--) {
                        elType = selectedElements[i].asc_getObjectType();
                        elValue = selectedElements[i].asc_getObjectValue();
                        if (Asc.c_oAscTypeSelectElement.Image == elType && elValue.asc_getShapeProperties()) {
                            (new SSE.Views.ShapeSettingsAdvanced(
                                {
                                    shapeProps: elValue,
                                    handler: function(result, value) {
                                        if (result == 'ok') {
                                            if (me.api) {
                                                me.api.asc_setGraphicObjectProps(value.shapeProps);
                                            }
                                        }
                                        Common.NotificationCenter.trigger('edit:complete', me);
                                    }
                            })).show();
                            break;
                        }
                    }
                }
            }
        },

        ChangeSettings: function(props) {
            if (this._initSettings)
                this.createDelayedElements();

            if (this.imgprops==null)
                this.imgprops = new Asc.asc_CImgProperty();

            if (props && props.asc_getShapeProperties())
            {
                var shapeprops = props.asc_getShapeProperties(),
                    shapetype = shapeprops.asc_getType();
                this._originalProps = shapeprops;

                this._noApply = true;

                this.disableControls(this._locked, !shapeprops.asc_getCanFill());
                this.hideShapeOnlySettings(shapeprops.asc_getFromChart() || shapeprops.asc_getFromImage());

                var hidechangetype = shapeprops.get_FromChart() || shapetype=='line' || shapetype=='bentConnector2' || shapetype=='bentConnector3'
                    || shapetype=='bentConnector4' || shapetype=='bentConnector5' || shapetype=='curvedConnector2'
                    || shapetype=='curvedConnector3' || shapetype=='curvedConnector4' || shapetype=='curvedConnector5'
                    || shapetype=='straightConnector1';
                this.hideChangeTypeSettings(hidechangetype);
                this._state.isFromImage = !!shapeprops.get_FromImage();
                if (!hidechangetype && this.btnChangeShape.menu.items.length) {
                    this.btnChangeShape.menu.items[0].setVisible(shapeprops.get_FromImage());
                    this.btnChangeShape.menu.items[1].setVisible(!shapeprops.get_FromImage());
                }

                // background colors
                var rec = null;
                var fill = shapeprops.asc_getFill();
                var fill_type = fill.asc_getType();
                var color = null;
                var transparency = fill.asc_getTransparent();
                if ( Math.abs(this._state.Transparency-transparency)>0.001 || Math.abs(this.numTransparency.getNumberValue()-transparency)>0.001 ||
                    (this._state.Transparency===null || transparency===null)&&(this._state.Transparency!==transparency || this.numTransparency.getNumberValue()!==transparency)) {

                    if (transparency !== undefined) {
                        this.sldrTransparency.setValue((transparency===null) ? 100 : transparency/255*100, true);
                        this.numTransparency.setValue(this.sldrTransparency.getValue(), true);
                    }
                    this._state.Transparency=transparency;
                }

                if (fill===null || fill_type===null) { // заливка не совпадает у неск. фигур
                    this.OriginalFillType = null;
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_NOFILL) { // заливки нет
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_NOFILL;
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_SOLID) {
                    fill = fill.asc_getFill();
                    color = fill.asc_getColor();
                    if (color) {
                        if (color.asc_getType() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.ShapeColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB()), effectValue: color.asc_getValue() }};
                        } else {
                            this.ShapeColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB())};
                        }

                    } else
                        this.ShapeColor = {Value: 0, Color: 'transparent'};
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_SOLID;
                    this.FGColor = (this.ShapeColor.Color!=='transparent') ? {Value: 1, Color: Common.Utils.ThemeColor.colorValue2EffectId(this.ShapeColor.Color)} : {Value: 1, Color: '000000'};
                    this.BGColor = {Value: 1, Color: 'ffffff'};
                    this.GradColor.colors[0] = (this.ShapeColor.Color!=='transparent') ? Common.Utils.ThemeColor.colorValue2EffectId(this.ShapeColor.Color) : '000000';
                    this.GradColor.colors[this.GradColor.colors.length-1] = 'ffffff';
                }  else if (fill_type==Asc.c_oAscFill.FILL_TYPE_BLIP) {
                    fill = fill.asc_getFill();
                    this.BlipFillType = fill.asc_getType(); // null - не совпадают у нескольких фигур
                    if (this._state.BlipFillType !== this.BlipFillType) {
                        if (this.BlipFillType == Asc.c_oAscFillBlipType.STRETCH || this.BlipFillType == Asc.c_oAscFillBlipType.TILE) {
                            this.cmbFillType.setValue(this.BlipFillType);
                        } else
                            this.cmbFillType.setValue('');
                        this._state.BlipFillType = this.BlipFillType;
                    }
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_BLIP;
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill = fill.asc_getFill();
                    this.PatternFillType = fill.asc_getPatternType(); // null - не совпадают у нескольких фигур
                    if (this._state.PatternFillType !== this.PatternFillType) {
                        this.cmbPattern.suspendEvents();
                        var rec = this.cmbPattern.menuPicker.store.findWhere({
                            type: this.PatternFillType
                        });
                        this.cmbPattern.menuPicker.selectRecord(rec);
                        this.cmbPattern.resumeEvents();
                        this._state.PatternFillType = this.PatternFillType;
                    }

                    color = fill.asc_getColorFg();
                    if (color) {
                        if (color.asc_getType() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.FGColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB()), effectValue: color.asc_getValue() }};
                        } else {
                            this.FGColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB())};
                        }
                    } else
                        this.FGColor = {Value: 1, Color: '000000'};

                    color = fill.asc_getColorBg();
                    if (color) {
                        if (color.asc_getType() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.BGColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB()), effectValue: color.asc_getValue() }};
                        } else {
                            this.BGColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB())};
                        }
                    } else
                        this.BGColor = {Value: 1, Color: 'ffffff'};

                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_PATT;
                    this.ShapeColor = {Value: 1, Color: Common.Utils.ThemeColor.colorValue2EffectId(this.FGColor.Color)};
                    this.GradColor.colors[0] = Common.Utils.ThemeColor.colorValue2EffectId(this.FGColor.Color);
                    this.GradColor.colors[this.GradColor.colors.length-1] = 'ffffff';
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_GRAD) {
                    fill = fill.asc_getFill();
                    var gradfilltype = fill.asc_getGradType();  // null - не совпадают у нескольких фигур
                    if (this._state.GradFillType !== gradfilltype || this.GradFillType !== gradfilltype) {
                        this.GradFillType = gradfilltype;
                        rec = undefined;
                        if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR || this.GradFillType == Asc.c_oAscFillGradType.GRAD_PATH) {
                            this.cmbGradType.setValue(this.GradFillType);
                            rec = this.cmbGradType.store.findWhere({value: this.GradFillType});
                            this.onGradTypeSelect(this.cmbGradType, rec.attributes);
                        } else {
                            this.cmbGradType.setValue('');
                            this.btnDirection.setIconCls('');
                        }
                        this._state.GradFillType = this.GradFillType;
                    }

                    if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR ) {
                        var value = Math.floor(fill.asc_getLinearAngle()/60000);
                        if (Math.abs(this.GradLinearDirectionType-value)>0.001) {
                            this.GradLinearDirectionType=value;
                            var record = this.mnuDirectionPicker.store.findWhere({type: value});
                            this.mnuDirectionPicker.selectRecord(record, true);
                            if (record)
                                this.btnDirection.setIconCls('item-gradient ' + record.get('iconcls'));
                            else
                                this.btnDirection.setIconCls('');
                        }
                    }

                    var me = this;
                    var colors = fill.asc_getColors(),
                        positions = fill.asc_getPositions(),
                        length = colors ? colors.length : this.GradColor.colors.length;
                    this.sldrGradient.setThumbs(length);
                    if (this.GradColor.colors.length>length) {
                        this.GradColor.colors.splice(length, this.GradColor.colors.length - length);
                        this.GradColor.values.splice(length, this.GradColor.colors.length - length);
                        this.GradColor.currentIdx = 0;
                    }
                    colors && colors.forEach(function(color, index) {
                        if (color) {
                            if (color.asc_getType() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                me.GradColor.colors[index] = {color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB()), effectValue: color.asc_getValue()};
                                Common.Utils.ThemeColor.colorValue2EffectId(me.GradColor.colors[index]);
                            } else {
                                me.GradColor.colors[index] = Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB());
                            }
                        } else
                            me.GradColor.colors[index] = '000000';

                        var position = positions[index];
                        if (position!==null)       {
                            position = position/1000;
                            me.GradColor.values[index] = position;
                        }
                    });
                    for (var index=0; index<length; index++) {
                        me.sldrGradient.setColorValue(Common.Utils.String.format('#{0}', (typeof(me.GradColor.colors[index]) == 'object') ? me.GradColor.colors[index].color : me.GradColor.colors[index]), index);
                        me.sldrGradient.setValue(index, me.GradColor.values[index]);
                    }
                    if (_.isUndefined(me.GradColor.currentIdx) || me.GradColor.currentIdx >= this.GradColor.colors.length) {
                        me.GradColor.currentIdx = 0;
                    }
                    me.sldrGradient.setActiveThumb(me.GradColor.currentIdx);
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_GRAD;
                    this.FGColor = {Value: 1, Color: this.GradColor.colors[0]};
                    this.BGColor = {Value: 1, Color: 'ffffff'};
                    this.ShapeColor = {Value: 1, Color: this.GradColor.colors[0]};
                }

                if ( this._state.FillType!==this.OriginalFillType ) {
                    this.cmbFillSrc.setValue((this.OriginalFillType===null) ? '' : this.OriginalFillType);
                    this._state.FillType=this.OriginalFillType;
                    this.ShowHideElem(this.OriginalFillType);
                }

                $(this.btnTexture.el).find('.form-control').prop('innerHTML', this.textSelectTexture);

                var type1 = typeof(this.ShapeColor.Color),
                    type2 = typeof(this._state.ShapeColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.ShapeColor.Color.effectValue!==this._state.ShapeColor.effectValue || this._state.ShapeColor.color.indexOf(this.ShapeColor.Color.color)<0)) ||
                    (type1!='object' && this._state.ShapeColor.indexOf(this.ShapeColor.Color)<0 )) {

                    this.btnBackColor.setColor(this.ShapeColor.Color);
                    if ( typeof(this.ShapeColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.ShapeColor.Color.effectValue ) {
                                this.colorsBack.select(this.ShapeColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsBack.clearSelection();
                    } else
                        this.colorsBack.select(this.ShapeColor.Color,true);

                    this._state.ShapeColor = this.ShapeColor.Color;
                }

                // border colors
                var stroke = shapeprops.asc_getStroke(),
                    strokeType = stroke.asc_getType(),
                    borderType,
                    update = (this._state.StrokeColor == 'transparent' && this.BorderColor.Color !== 'transparent'); // border color was changed for shape without line and then shape was reselected (or apply other settings)

                if (stroke) {
                    if ( strokeType == Asc.c_oAscStrokeType.STROKE_COLOR ) {
                        color = stroke.asc_getColor();
                        if (color) {
                            if (color.asc_getType() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                this.BorderColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB()), effectValue: color.asc_getValue() }};
                            }
                            else
                                this.BorderColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.asc_getR(), color.asc_getG(), color.asc_getB())};
                        }
                        else
                            this.BorderColor = {Value: 1, Color: 'transparent'};
                    } else {
                        this.BorderColor = {Value: 1, Color: 'transparent'};
                    }
                    borderType = stroke.asc_getPrstDash();
                } else  { // no stroke
                    strokeType = null;
                    this.BorderColor = {Value: 0, Color: 'transparent'};
                }

                type1 = typeof(this.BorderColor.Color);
                type2 = typeof(this._state.StrokeColor);

                if ( update || (type1 !== type2) || (type1=='object' &&
                    (this.BorderColor.Color.effectValue!==this._state.StrokeColor.effectValue || this._state.StrokeColor.color.indexOf(this.BorderColor.Color.color)<0)) ||
                    (type1!='object' && (this._state.StrokeColor.indexOf(this.BorderColor.Color)<0 || typeof(this.btnBorderColor.color)=='object'))) {

                    this.btnBorderColor.setColor(this.BorderColor.Color);
                    if ( typeof(this.BorderColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.BorderColor.Color.effectValue ) {
                                this.colorsBorder.select(this.BorderColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsBorder.clearSelection();
                    } else
                        this.colorsBorder.select(this.BorderColor.Color,true);

                    this._state.StrokeColor = this.BorderColor.Color;
                }

                if (this._state.StrokeType !== strokeType || strokeType == Asc.c_oAscStrokeType.STROKE_COLOR) {
                    if ( strokeType == Asc.c_oAscStrokeType.STROKE_COLOR ) {
                        var w = stroke.asc_getWidth();
                        var check_value = (Math.abs(this._state.StrokeWidth-w)<0.00001) && !((new RegExp(this.txtPt + '\\s*$')).test(this.cmbBorderSize.getRawValue()));
                        if ( Math.abs(this._state.StrokeWidth-w)>0.00001 || check_value ||
                            (this._state.StrokeWidth===null || w===null)&&(this._state.StrokeWidth!==w)) {
                            this._state.StrokeWidth = w;

                            if (w!==null) w = this._mm2pt(w);
                            var _selectedItem = (w===null) ? w : _.find(this.cmbBorderSize.store.models, function(item) {
                                if ( w<item.attributes.value+0.00001 && w>item.attributes.value-0.00001) {
                                    return true;
                                }
                            });
                            if (_selectedItem)
                                this.cmbBorderSize.selectRecord(_selectedItem);
                            else {
                                this.cmbBorderSize.setValue((w!==null) ? parseFloat(w.toFixed(2)) + ' ' + this.txtPt : '');
                            }
                            this.BorderSize = w;
                        }
                    } else if (strokeType == Asc.c_oAscStrokeType.STROKE_NONE) {
                        this._state.StrokeWidth = 0;
                        this.BorderSize = this.cmbBorderSize.store.at(0).get('value');
                        this.cmbBorderSize.setValue(this.BorderSize);
                    } else {
                        this._state.StrokeWidth = null;
                        this.BorderSize = -1;
                        this.cmbBorderSize.setValue(null);
                    }
                    this._state.StrokeType = strokeType;
                }

                if (this._state.StrokeBorderType !== borderType) {
                    this.BorderType = this._state.StrokeBorderType = borderType;
                    this.cmbBorderType.setValue(borderType);
                }
                
                // pattern colors
                type1 = typeof(this.FGColor.Color);
                type2 = typeof(this._state.FGColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.FGColor.Color.effectValue!==this._state.FGColor.effectValue || this._state.FGColor.color.indexOf(this.FGColor.Color.color)<0)) ||
                    (type1!='object' && this._state.FGColor.indexOf(this.FGColor.Color)<0 )) {

                    this.btnFGColor.setColor(this.FGColor.Color);
                    if ( typeof(this.FGColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.FGColor.Color.effectValue ) {
                                this.colorsFG.select(this.FGColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsFG.clearSelection();
                    } else
                        this.colorsFG.select(this.FGColor.Color,true);

                    this._state.FGColor = this.FGColor.Color;
                }

                type1 = typeof(this.BGColor.Color);
                type2 = typeof(this._state.BGColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.BGColor.Color.effectValue!==this._state.BGColor.effectValue || this._state.BGColor.color.indexOf(this.BGColor.Color.color)<0)) ||
                    (type1!='object' && this._state.BGColor.indexOf(this.BGColor.Color)<0 )) {

                    this.btnBGColor.setColor(this.BGColor.Color);
                    if ( typeof(this.BGColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.BGColor.Color.effectValue ) {
                                this.colorsBG.select(this.BGColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsBG.clearSelection();
                    } else
                        this.colorsBG.select(this.BGColor.Color,true);

                    this._state.BGColor = this.BGColor.Color;
                }

                color = this.GradColor.colors[this.GradColor.currentIdx];
                type1 = typeof(color);
                type2 = typeof(this._state.GradColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (color.effectValue!==this._state.GradColor.effectValue || this._state.GradColor.color.indexOf(color.color)<0)) ||
                    (type1!='object' && this._state.GradColor.indexOf(color)<0 )) {

                    this.btnGradColor.setColor(color);
                    if ( typeof(color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == color.effectValue ) {
                                this.colorsGrad.select(color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsGrad.clearSelection();
                    } else
                        this.colorsGrad.select(color,true);

                    this._state.GradColor = color;
                }

                this.chShadow.setValue(!!shapeprops.asc_getShadow(), true);

                this._noApply = false;
            }
        },

        createDelayedControls: function() {
            var me = this;

            this._arrFillSrc = [
                {displayValue: this.textColor,          value: Asc.c_oAscFill.FILL_TYPE_SOLID},
                {displayValue: this.textGradientFill,   value: Asc.c_oAscFill.FILL_TYPE_GRAD},
                {displayValue: this.textImageTexture,   value: Asc.c_oAscFill.FILL_TYPE_BLIP},
                {displayValue: this.textPatternFill,    value: Asc.c_oAscFill.FILL_TYPE_PATT},
                {displayValue: this.textNoFill,         value: Asc.c_oAscFill.FILL_TYPE_NOFILL}
            ];

            this.cmbFillSrc = new Common.UI.ComboBox({
                el: $('#shape-combo-fill-src'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 100%;',
                editable: false,
                data: this._arrFillSrc
            });
            this.cmbFillSrc.setValue(this._arrFillSrc[0].value);
            this.cmbFillSrc.on('selected', _.bind(this.onFillSrcSelect, this));
            this.fillControls.push(this.cmbFillSrc);

            this.cmbPattern = new Common.UI.ComboDataView({
                itemWidth: 28,
                itemHeight: 28,
                menuMaxHeight: 300,
                enableKeyEvents: true,
                cls: 'combo-pattern'
            });
            this.cmbPattern.menuPicker.itemTemplate = this.cmbPattern.fieldPicker.itemTemplate = _.template([
                    '<div class="style" id="<%= id %>">',
                        '<img src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" class="combo-pattern-item" ',
                        'width="' + this.cmbPattern.itemWidth + '" height="' + this.cmbPattern.itemHeight + '" ',
                        'style="background-position: -<%= offsetx %>px -<%= offsety %>px;"/>',
                    '</div>'
                ].join(''));
            this.cmbPattern.render($('#shape-combo-pattern'));
            this.cmbPattern.openButton.menu.cmpEl.css({
                'min-width': 178,
                'max-width': 178
            });
            this.cmbPattern.on('click', _.bind(this.onPatternSelect, this));
            this.cmbPattern.openButton.menu.on('show:after', function () {
                me.cmbPattern.menuPicker.scroller.update({alwaysVisibleY: true});
            });
            this.fillControls.push(this.cmbPattern);

            this.btnInsertFromFile = new Common.UI.Button({
                el: $('#shape-button-from-file')
            });
            this.fillControls.push(this.btnInsertFromFile);

            this.btnInsertFromUrl = new Common.UI.Button({
                el: $('#shape-button-from-url')
            });
            this.fillControls.push(this.btnInsertFromUrl);

            this.btnInsertFromFile.on('click', _.bind(function(btn){
                if (this.api) this.api.asc_changeShapeImageFromFile(this.BlipFillType);
                Common.NotificationCenter.trigger('edit:complete', this);
            }, this));
            this.btnInsertFromUrl.on('click', _.bind(this.insertFromUrl, this));

            this._arrFillType = [
                {displayValue: this.textStretch, value: Asc.c_oAscFillBlipType.STRETCH},
                {displayValue: this.textTile,    value: Asc.c_oAscFillBlipType.TILE}
            ];

            this.cmbFillType = new Common.UI.ComboBox({
                el: $('#shape-combo-fill-type'),
                cls: 'input-group-nr',
                menuStyle: 'min-width: 90px;',
                editable: false,
                data: this._arrFillType
            });
            this.cmbFillType.setValue(this._arrFillType[0].value);
            this.cmbFillType.on('selected', _.bind(this.onFillTypeSelect, this));
            this.fillControls.push(this.cmbFillType);

            this.numTransparency = new Common.UI.MetricSpinner({
                el: $('#shape-spin-transparency'),
                step: 1,
                width: 62,
                value: '100 %',
                defaultUnit : "%",
                maxValue: 100,
                minValue: 0
            });
            this.numTransparency.on('change', _.bind(this.onNumTransparencyChange, this));
            this.numTransparency.on('inputleave', function(){ Common.NotificationCenter.trigger('edit:complete', me);});
            this.fillControls.push(this.numTransparency);

            this.sldrTransparency = new Common.UI.SingleSlider({
                el: $('#shape-slider-transparency'),
                width: 75,
                minValue: 0,
                maxValue: 100,
                value: 100
            });
            this.sldrTransparency.on('change', _.bind(this.onTransparencyChange, this));
            this.sldrTransparency.on('changecomplete', _.bind(this.onTransparencyChangeComplete, this));
            this.fillControls.push(this.sldrTransparency);

            this.lblTransparencyStart = $(this.el).find('#shape-lbl-transparency-start');
            this.lblTransparencyEnd = $(this.el).find('#shape-lbl-transparency-end');

            this._arrGradType = [
                {displayValue: this.textLinear, value: Asc.c_oAscFillGradType.GRAD_LINEAR},
                {displayValue: this.textRadial, value: Asc.c_oAscFillGradType.GRAD_PATH}
            ];

            this.cmbGradType = new Common.UI.ComboBox({
                el: $('#shape-combo-grad-type'),
                cls: 'input-group-nr',
                menuStyle: 'min-width: 90px;',
                editable: false,
                data: this._arrGradType
            });
            this.cmbGradType.setValue(this._arrGradType[0].value);
            this.cmbGradType.on('selected', _.bind(this.onGradTypeSelect, this));
            this.fillControls.push(this.cmbGradType);

            this._viewDataLinear = [
                { offsetx: 0,   offsety: 0,   type:45,  subtype:-1, iconcls:'gradient-left-top' },
                { offsetx: 50,  offsety: 0,   type:90,  subtype:4,  iconcls:'gradient-top'},
                { offsetx: 100, offsety: 0,   type:135, subtype:5,  iconcls:'gradient-right-top'},
                { offsetx: 0,   offsety: 50,  type:0,   subtype:6,  iconcls:'gradient-left', cls: 'item-gradient-separator', selected: true},
                { offsetx: 100, offsety: 50,  type:180, subtype:1,  iconcls:'gradient-right'},
                { offsetx: 0,   offsety: 100, type:315, subtype:2,  iconcls:'gradient-left-bottom'},
                { offsetx: 50,  offsety: 100, type:270, subtype:3,  iconcls:'gradient-bottom'},
                { offsetx: 100, offsety: 100, type:225, subtype:7,  iconcls:'gradient-right-bottom'}
            ];

            this._viewDataRadial = [
                { offsetx: 100, offsety: 150, type:2, subtype:5, iconcls:'gradient-radial-center'}
            ];

            this.btnDirection = new Common.UI.Button({
                cls         : 'btn-large-dataview',
                iconCls     : 'item-gradient gradient-left',
                menu        : new Common.UI.Menu({
                    style: 'min-width: 60px;',
                    menuAlign: 'tr-br',
                    items: [
                        { template: _.template('<div id="id-shape-menu-direction" style="width: 175px; margin: 0 5px;"></div>') }
                    ]
                })
            });
            this.btnDirection.on('render:after', function(btn) {
                me.mnuDirectionPicker = new Common.UI.DataView({
                    el: $('#id-shape-menu-direction'),
                    parentMenu: btn.menu,
                    restoreHeight: 174,
                    store: new Common.UI.DataViewStore(me._viewDataLinear),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-gradient" style="background-position: -<%= offsetx %>px -<%= offsety %>px;"></div>')
                });
            });
            this.btnDirection.render($('#shape-button-direction'));
            this.mnuDirectionPicker.on('item:click', _.bind(this.onSelectGradient, this, this.btnDirection));
            this.fillControls.push(this.btnDirection);

            this.sldrGradient = new Common.UI.MultiSliderGradient({
                el: $('#shape-slider-gradient'),
                width: 125,
                minValue: 0,
                maxValue: 100,
                values: [0, 100]
            });
            this.sldrGradient.on('change', _.bind(this.onGradientChange, this));
            this.sldrGradient.on('changecomplete', _.bind(this.onGradientChangeComplete, this));
            this.sldrGradient.on('thumbclick', function(cmp, index){
                me.GradColor.currentIdx = index;
                var color = me.GradColor.colors[me.GradColor.currentIdx];
                me.btnGradColor.setColor(color);
                me.colorsGrad.select(color,false);
            });
            this.sldrGradient.on('thumbdblclick', function(cmp){
                me.btnGradColor.cmpEl.find('button').dropdown('toggle');
            });
            this.sldrGradient.on('sortthumbs', function(cmp, recalc_indexes){
                var colors = [],
                    currentIdx;
                _.each (recalc_indexes, function(recalc_index, index) {
                    colors.push(me.GradColor.colors[recalc_index]);
                    if (me.GradColor.currentIdx == recalc_index)
                        currentIdx = index;
                });
                me.OriginalFillType = null;
                me.GradColor.colors = colors;
                me.GradColor.currentIdx = currentIdx;
            });
            this.sldrGradient.on('addthumb', function(cmp, index, nearIndex, color){
                me.GradColor.colors[index] = me.GradColor.colors[nearIndex];
                me.GradColor.currentIdx = index;
                me.sldrGradient.addNewThumb(index, color);
            });
            this.sldrGradient.on('removethumb', function(cmp, index){
                me.sldrGradient.removeThumb(index);
                me.GradColor.values.splice(index, 1);
                me.sldrGradient.changeGradientStyle();
            });
            this.fillControls.push(this.sldrGradient);

            this.cmbBorderSize = new Common.UI.ComboBorderSizeEditable({
                el: $('#shape-combo-border-size'),
                style: "width: 93px;",
                txtNoBorders: this.txtNoBorders
            })
            .on('selected', _.bind(this.onBorderSizeSelect, this))
            .on('changed:before', _.bind(this.onBorderSizeChanged, this, true))
            .on('changed:after',  _.bind(this.onBorderSizeChanged, this, false))
            .on('combo:blur',     _.bind(this.onComboBlur, this, false));
            this.BorderSize = this.cmbBorderSize.store.at(2).get('value');
            this.cmbBorderSize.setValue(this.BorderSize);
            this.lockedControls.push(this.cmbBorderSize);

            this.cmbBorderType = new Common.UI.ComboBorderType({
                el: $('#shape-combo-border-type'),
                style: "width: 93px;",
                menuStyle: 'min-width: 93px;'
            }).on('selected', _.bind(this.onBorderTypeSelect, this))
            .on('combo:blur',    _.bind(this.onComboBlur, this, false));
            this.BorderType = Asc.c_oDashType.solid;
            this.cmbBorderType.setValue(this.BorderType);
            this.lockedControls.push(this.cmbBorderType);

            this.btnChangeShape = new Common.UI.Button({
                parentEl: $('#shape-btn-change'),
                cls: 'btn-icon-default',
                iconCls: 'btn-change-shape',
                menu        : new Common.UI.Menu({
                    menuAlign: 'tr-br',
                    cls: 'menu-shapes',
                    items: []
                })
            });
            this.lockedControls.push(this.btnChangeShape);

            this.btnRotate270 = new Common.UI.Button({
                parentEl: $('#shape-button-270', me.$el),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-rotate-270',
                value: 0,
                hint: this.textHint270
            });
            this.btnRotate270.on('click', _.bind(this.onBtnRotateClick, this));
            this.lockedControls.push(this.btnRotate270);

            this.btnRotate90 = new Common.UI.Button({
                parentEl: $('#shape-button-90', me.$el),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-rotate-90',
                value: 1,
                hint: this.textHint90
            });
            this.btnRotate90.on('click', _.bind(this.onBtnRotateClick, this));
            this.lockedControls.push(this.btnRotate90);

            this.btnFlipV = new Common.UI.Button({
                parentEl: $('#shape-button-flipv', me.$el),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-flip-vert',
                value: 0,
                hint: this.textHintFlipV
            });
            this.btnFlipV.on('click', _.bind(this.onBtnFlipClick, this));
            this.lockedControls.push(this.btnFlipV);

            this.btnFlipH = new Common.UI.Button({
                parentEl: $('#shape-button-fliph', me.$el),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-flip-hor',
                value: 1,
                hint: this.textHintFlipH
            });
            this.btnFlipH.on('click', _.bind(this.onBtnFlipClick, this));
            this.lockedControls.push(this.btnFlipH);

            this.chShadow = new Common.UI.CheckBox({
                el: $('#shape-checkbox-shadow'),
                labelText: this.strShadow
            });
            this.chShadow.on('change', _.bind(this.onCheckShadow, this));
            this.lockedControls.push(this.chShadow);

            $(this.el).on('click', '#shape-advanced-link', _.bind(this.openAdvancedSettings, this));
            this.linkAdvanced = $('#shape-advanced-link');
        },

        createDelayedElements: function() {
            this._initSettings = false;
            this.createDelayedControls();
            
            var global_hatch_menu_map = [
                0,1,3,2,4,
                53,5,6,7,8,
                9,10,11,12,13,
                14,15,16,17,18,
                19,20,22,23,24,
                25,27,28,29,30,
                31,32,33,34,35,
                36,37,38,39,40,
                41,42,43,44,45,
                46,49,50,51,52
            ];

            this.patternViewData = [];
            for (var i=0; i<13; i++) {
                for (var j=0; j<4; j++) {
                    var num = i*4+j;
                    this.patternViewData[num] = {offsetx: j*28, offsety: i*28, type: global_hatch_menu_map[num]};
                }
            }
            this.patternViewData.splice(this.patternViewData.length-2, 2);

            for ( var i=0; i<this.patternViewData.length; i++ ) {
                this.patternViewData[i].id = Common.UI.getId();
            }
            this.cmbPattern.menuPicker.store.add(this.patternViewData);
            if (this.cmbPattern.menuPicker.store.length > 0) {
                this.cmbPattern.fillComboView(this.cmbPattern.menuPicker.store.at(0),true);
                this.PatternFillType = this.patternViewData[0].type;
            }

            this.onInitStandartTextures();
            this.onApiAutoShapes();
            this.UpdateThemeColors();
        },

        onInitStandartTextures: function(texture) {
            var me = this;
            if (texture && texture.length>0){
                me._texturearray = [];
                _.each(texture, function(item){
                    me._texturearray.push({
                        imageUrl: item.asc_getImage(),
                        name   : me.textureNames[item.asc_getId()],
                        type    : item.asc_getId(),
//                        allowSelected : false,
                        selected: false
                    });
                });
            }

            if (!me._texturearray || me._texturearray.length<1) return;
            if (!this._initSettings && !this.btnTexture) {
                this.btnTexture = new Common.UI.ComboBox({
                    el: $('#shape-combo-fill-texture'),
                    template: _.template([
                        '<div class="input-group combobox combo-dataview-menu input-group-nr dropdown-toggle" tabindex="0" data-toggle="dropdown">',
                            '<div class="form-control text" style="width: 90px;">' + this.textSelectTexture + '</div>',
                            '<div style="display: table-cell;"></div>',
                            '<button type="button" class="btn btn-default"><span class="caret img-commonctrl"></span></button>',
                        '</div>'
                    ].join(''))
                });
                this.textureMenu = new Common.UI.Menu({
                    items: [
                        { template: _.template('<div id="id-shape-menu-texture" style="width: 233px; margin: 0 5px;"></div>') }
                    ]
                });
                this.textureMenu.render($('#shape-combo-fill-texture'));
                this.fillControls.push(this.btnTexture);

                var onShowBefore = function(menu) {
                    var mnuTexturePicker = new Common.UI.DataView({
                        el: $('#id-shape-menu-texture'),
                        restoreHeight: 174,
                        parentMenu: menu,
                        showLast: false,
                        store: new Common.UI.DataViewStore(me._texturearray || []),
                        itemTemplate: _.template('<div class="item-texture"><img src="<%= imageUrl %>" id="<%= id %>"></div>')
                    });
                    mnuTexturePicker.on('item:click', _.bind(me.onSelectTexture, me));
                    menu.off('show:before', onShowBefore);
                };
                this.textureMenu.on('show:before', onShowBefore);
            }
        },

        onSelectTexture: function(picker, view, record){
            this._fromTextureCmb = true;
            this.cmbFillType.setValue(this._arrFillType[1].value);
            this._fromTextureCmb = false;

            if (this.api) {
                var props = new Asc.asc_CShapeProperty();
                var fill = new Asc.asc_CShapeFill();
                fill.asc_putType(Asc.c_oAscFill.FILL_TYPE_BLIP);
                fill.asc_putFill( new Asc.asc_CFillBlip());
                fill.asc_getFill().asc_putType(Asc.c_oAscFillBlipType.TILE);
                fill.asc_getFill().asc_putTextureId(record.get('type'));
                props.asc_putFill(fill);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            $(this.btnTexture.el).find('.form-control').prop('innerHTML', record.get('name'));
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onApiAutoShapes: function() {
            var me = this;
            var onShowBefore = function(menu) {
                me.fillAutoShapes();
                menu.off('show:before', onShowBefore);
            };
            me.btnChangeShape.menu.on('show:before', onShowBefore);
        },

        fillAutoShapes: function() {
            var me = this,
                shapesStore = this.application.getCollection('ShapeGroups'),
                count = shapesStore.length;

            var onShowAfter = function(menu) {
                for (var i=-1; i<count-1 && count>0; i++) {
                    var store = shapesStore.at(i > -1 ? i : 0).get('groupStore');
                    if (i<0) {
                        store = store.clone();
                        store.shift();
                    }
                    var shapePicker = new Common.UI.DataViewSimple({
                        el: $('#id-shape-menu-shapegroup' + (i+1), menu.items[i+1].$el),
                        store: store,
                        parentMenu: menu.items[i+1].menu,
                        itemTemplate: _.template('<div class="item-shape" id="<%= id %>"><svg width="20" height="20" class=\"icon\"><use xlink:href=\"#svg-icon-<%= data.shapeType %>\"></use></svg></div>')
                    });
                    shapePicker.on('item:click', function(picker, item, record, e) {
                        if (me.api) {
                            me.api.asc_changeShapeType(record.get('data').shapeType);
                            Common.NotificationCenter.trigger('edit:complete', me);
                        }
                        if (e.type !== 'click')
                            me.btnChangeShape.menu.hide();
                    });
                }
                menu.off('show:after', onShowAfter);
            };
            me.btnChangeShape.menu.on('show:after', onShowAfter);

            for (var i=-1; i<count-1 && count>0; i++) {
                var shapeGroup = shapesStore.at(i>-1 ? i : i+1);
                var menuItem = new Common.UI.MenuItem({
                    caption: shapeGroup.get('groupName'),
                    menu: new Common.UI.Menu({
                        menuAlign: 'tr-tl',
                        items: [
                            { template: _.template('<div id="id-shape-menu-shapegroup' + (i+1) + '" class="menu-shape" style="width: ' + (shapeGroup.get('groupWidth') - 8) + 'px; margin-left: 5px;"></div>') }
                        ]
                    })
                });
                me.btnChangeShape.menu.addItem(menuItem);
            }
            me.btnChangeShape.menu.items[0].setVisible(me._state.isFromImage);
            me.btnChangeShape.menu.items[1].setVisible(!me._state.isFromImage);
        },

        onBtnRotateClick: function(btn) {
            var props = new Asc.asc_CShapeProperty();
            props.asc_putRotAdd((btn.options.value==1 ? 90 : 270) * 3.14159265358979 / 180);
            this.imgprops.asc_putShapeProperties(props);
            this.api.asc_setGraphicObjectProps(this.imgprops);
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onBtnFlipClick: function(btn) {
            var props = new Asc.asc_CShapeProperty();
            if (btn.options.value==1)
                props.asc_putFlipHInvert(true);
            else
                props.asc_putFlipVInvert(true);
            this.imgprops.asc_putShapeProperties(props);
            this.api.asc_setGraphicObjectProps(this.imgprops);
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        onCheckShadow: function(field, newValue, oldValue, eOpts) {
            if (this.api)   {
                var props = new Asc.asc_CShapeProperty();
                props.asc_putShadow((field.getValue()=='checked') ? new Asc.asc_CShadowProperty() : null);
                this.imgprops.asc_putShapeProperties(props);
                this.api.asc_setGraphicObjectProps(this.imgprops);
            }
            Common.NotificationCenter.trigger('edit:complete', this);
        },

        UpdateThemeColors: function() {
            if (this._initSettings) return;
            if (!this.btnBackColor) {
                this.btnBackColor = new Common.UI.ColorButton({
                    parentEl: $('#shape-back-color-btn'),
                    style: "width:45px;",
                    transparent: true
                });
                this.btnBackColor.setColor('transparent');
                this.fillControls.push(this.btnBackColor);
                this.colorsBack = this.btnBackColor.getPicker();
                this.btnBackColor.on('color:select', _.bind(this.onColorsBackSelect, this));

                this.btnBorderColor = new Common.UI.ColorButton({
                    parentEl: $('#shape-border-color-btn'),
                    style: "width:45px;"
                });
                this.btnBorderColor.setColor('000000');
                this.lockedControls.push(this.btnBorderColor);
                this.colorsBorder = this.btnBorderColor.getPicker();
                this.btnBorderColor.on('color:select', _.bind(this.onColorsBorderSelect, this));

                this.btnFGColor = new Common.UI.ColorButton({
                    parentEl: $('#shape-foreground-color-btn'),
                    style: "width:45px;"
                });
                this.btnFGColor.setColor('000000');
                this.fillControls.push(this.btnFGColor);
                this.colorsFG = this.btnFGColor.getPicker();
                this.btnFGColor.on('color:select', _.bind(this.onColorsFGSelect, this));

                this.btnBGColor = new Common.UI.ColorButton({
                    parentEl: $('#shape-background-color-btn'),
                    style: "width:45px;"
                });
                this.btnBGColor.setColor('ffffff');
                this.fillControls.push(this.btnBGColor);
                this.colorsBG = this.btnBGColor.getPicker();
                this.btnBGColor.on('color:select', _.bind(this.onColorsBGSelect, this));

                this.btnGradColor = new Common.UI.ColorButton({
                    parentEl: $('#shape-gradient-color-btn'),
                    style: "width:45px;"
                });
                this.btnGradColor.setColor('000000');
                this.fillControls.push(this.btnGradColor);
                this.colorsGrad = this.btnGradColor.getPicker();
                this.btnGradColor.on('color:select', _.bind(this.onColorsGradientSelect, this));
            }
            
            this.colorsBorder.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsBack.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsFG.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsBG.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsGrad.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
        },

        _pt2mm: function(value) {
            return (value * 25.4 / 72.0);
        },

        _mm2pt: function(value) {
            return (value * 72.0 / 25.4);
        },

        disableFillPanels: function(disable) {
            if (this._state.DisabledFillPanels!==disable) {
                this._state.DisabledFillPanels = disable;
                _.each(this.fillControls, function(item) {
                    item.setDisabled(disable);
                });
                this.lblTransparencyStart.toggleClass('disabled', disable);
                this.lblTransparencyEnd.toggleClass('disabled', disable);
            }
        },

        ShowHideElem: function(value) {
            this.FillColorContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_SOLID);
            this.FillImageContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_BLIP);
            this.FillPatternContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_PATT);
            this.FillGradientContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_GRAD);
            this.TransparencyContainer.toggleClass('settings-hidden', (value === Asc.c_oAscFill.FILL_TYPE_NOFILL || value === null));
        },

        setLocked: function (locked) {
            this._locked = locked;
        },

        disableControls: function(disable, disableFill) {
            if (this._initSettings) return;
            
            this.disableFillPanels(disable || disableFill);
            if (this._state.DisabledControls!==disable) {
                this._state.DisabledControls = disable;
                _.each(this.lockedControls, function(item) {
                    item.setDisabled(disable);
                });
                this.linkAdvanced.toggleClass('disabled', disable);
            }
        },

        hideShapeOnlySettings: function(value) {
            if (this._state.HideShapeOnlySettings !== value) {
                this._state.HideShapeOnlySettings = value;
                this.ShapeOnlySettings.toggleClass('hidden', value==true);
            }
        },

        hideChangeTypeSettings: function(value) {
            if (this._state.HideChangeTypeSettings !== value) {
                this._state.HideChangeTypeSettings = value;
                this.CanChangeType.toggleClass('hidden', value==true);
            }
        },

        txtNoBorders            : 'No Line',
        strStroke               : 'Stroke',
        strColor                : 'Color',
        strSize                 : 'Size',
        strChange               : 'Change Autoshape',
        strFill                 : 'Fill',
        textColor               : 'Color Fill',
        textImageTexture        : 'Picture or Texture',
        textTexture             : 'From Texture',
        textFromUrl             : 'From URL',
        textFromFile            : 'From File',
        textStretch             : 'Stretch',
        textTile                : 'Tile',
        txtCanvas               : 'Canvas',
        txtCarton               : 'Carton',
        txtDarkFabric           : 'Dark Fabric',
        txtGrain                : 'Grain',
        txtGranite              : 'Granite',
        txtGreyPaper            : 'Grey Paper',
        txtKnit                 : 'Knit',
        txtLeather              : 'Leather',
        txtBrownPaper           : 'Brown Paper',
        txtPapyrus              : 'Papyrus',
        txtWood                 : 'Wood',
        textAdvanced            : 'Show advanced settings',
        strTransparency         : 'Opacity',
        textNoFill              : 'No Fill',
        textSelectTexture       : 'Select',
        textGradientFill: 'Gradient Fill',
        textPatternFill: 'Pattern',
        strBackground: 'Background color',
        strForeground: 'Foreground color',
        strPattern: 'Pattern',
        textEmptyPattern: 'No Pattern',
        textLinear: 'Linear',
        textRadial: 'Radial',
        textDirection: 'Direction',
        textStyle: 'Style',
        textGradient: 'Gradient',
        textBorderSizeErr: 'The entered value is incorrect.<br>Please enter a value between 0 pt and 1584 pt.',
        strType: 'Type',
        textRotation: 'Rotation',
        textRotate90: 'Rotate 90°',
        textFlip: 'Flip',
        textHint270: 'Rotate 90° Counterclockwise',
        textHint90: 'Rotate 90° Clockwise',
        textHintFlipV: 'Flip Vertically',
        textHintFlipH: 'Flip Horizontally',
        strShadow: 'Show shadow'
    }, SSE.Views.ShapeSettings || {}));
});

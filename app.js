var app = new Vue({
	el: '#app',
	
	data() {
		return {
			pathMonth: '',
			xmlURL: '',
			promos: '',
			skus: '',
			urlSku: '',
			error: false,
			errorMsg: 'The following values are not valid skus, correct them and try again (remember to remove any extra white space):',
			wrongInputs: []
		}		
	},

	computed: {
		fullUrl: function(){
			return 'http://demandware.edgesuite.net/sits_pod51/dw/image/v2/AABJ_PRD/on/demandware.static/-/Sites-SBS-SallyBeautySupply/default/dw5886973e/images/large/SBS-' + this.urlSku + '.jpg?sw=345&sh=345&sm=fit&sfrm=png';
		}
	},

	methods: {
		pareDown: function(){
			var skuArr = this.skus.split(/\n/);
			var newSkuList = '';
			for (var i = 0; i < skuArr.length; i++){
				var firstNum = skuArr[i].search(/\d/);
				if (firstNum >= 0){
					newSkuList += skuArr[i].slice(firstNum, firstNum + 6);
					if (i < skuArr.length - 1){
						newSkuList += "\n";
					}
				}
			}
			this.skus = newSkuList;
		},

		sortSkus: function(){
			var sortedSkus = this.skus.split(/\s/).sort();
			var newSkuList = '';
			for (var i = 0; i < sortedSkus.length; i++){
				if (i < sortedSkus.length - 1){
					newSkuList += sortedSkus[i] + "\n";
				} else {
					newSkuList += sortedSkus[i];
				}
			}
			this.skus = newSkuList;
		},

		removeDuplicates: function(arr){
			var cleanArr = arr.filter(function(item, index, inputArr){
				return inputArr.indexOf(item) == index;
			});
			return cleanArr;
		},

		verifySkus: function(arr){
			this.wrongInputs = [];
			for (var i = 0; i < arr.length; i++){
				if (arr[i].length !== 6 || arr[i].search(/\D/) > -1){
					this.wrongInputs.push(arr[i]);
				}
			}

			if(this.wrongInputs.length > 0){
				this.error = true;
			} else {
				this.error = false;
				return true;
			}
		},

		downloadImages: function(){
			var skuArr = this.skus.split(/\s/);
			var cleanSkus = this.removeDuplicates(skuArr);

			if (this.verifySkus(cleanSkus) && (window.confirm("About to download " + cleanSkus.length + " images. Ready?"))){
				var save = document.getElementById("save");
				for (var i = 0; i < cleanSkus.length; i++){
					this.urlSku = cleanSkus[i];
					save.href = this.fullUrl;
					save.download = this.fullUrl;
					var evt = new MouseEvent('click',{
						bubbles: true,
						cancelable: true,
						view: window
					});
					save.dispatchEvent(evt);
				}
			}
		},

		sanitizePromos: function(){
			var separateRows = this.promos.split('\n'); //separates rows into array

			var separateCells = [];
			for (var i = 0; i < separateRows.length; i++){
				separateCells.push(separateRows[i].split('\t')); //separates cells into [ [],[] ] array
			}

			for(var i = 0; i < separateCells.length; i++){
				if(separateCells[i][0].search("Limit") > -1){
					// Array contains "LIMIT X", replace with correct Promo ID from previous array
					separateCells[i].splice(0,1,separateCells[i - 1][0]);
				}
			}

			this.promos = separateCells;
		},

		parseXML: function(){

			/*
			SAMPLE XML
			<?xml version="1.0" encoding="UTF-8"?><promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31"><promotion promotion-id="444672"><image>Promotions/Aug2017/SBS-264604.jpg</image></promotion></promotions>
			*/

			var xmlStart = '<?xml version="1.0" encoding="UTF-8"?><promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">';
			var xmlPromotion = '<promotion promotion-id="';
			var xmlEnabled = '"><enabled-flag>true</enabled-flag>'
			var xmlImage = '<image>Promotions/';
			var xmlSBS = '/SBS-';
			var xmlCloseTags = '.jpg</image></promotion>';
			var xmlEnd = '</promotions>';

			var xmlFinal = ''; // loop adds each promo to this string

			var skuString = /\d{6}/;

			for (var i = 0; i < this.promos.length; i++){
				if (!this.promos[i][0] || !this.promos[i][1]){
					continue;
				}
				if (this.promos[i][0].search(skuString) < 0){
					continue;
				} else if (this.promos[i][1].search(skuString) < 0){
					continue;
				}

				var promoID = this.promos[i][0].match(skuString)[0];
				var imgSku = this.promos[i][1].match(skuString)[0];

				xmlFinal += xmlPromotion + promoID + xmlEnabled + xmlImage + this.pathMonth + xmlSBS + imgSku + xmlCloseTags;
			}

			this.promos = xmlStart + xmlFinal + xmlEnd;

			var xmlFile = new Blob([this.promos],{type:'text/xml'});
			this.xmlURL = URL.createObjectURL(xmlFile);
			
		},

		downloadXML: function(){

		}
	}
});

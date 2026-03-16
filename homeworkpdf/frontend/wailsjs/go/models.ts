export namespace pdf {
	
	export class Settings {
	    pageSize: string;
	    orientation: string;
	    fontFamily: string;
	    fontSize: number;
	    marginTop: number;
	    marginBottom: number;
	    marginLeft: number;
	    marginRight: number;
	    childFriendly: boolean;
	    footerEnabled: boolean;
	    footerText: string;
	    customCSS: string;
	    unwrapFence: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pageSize = source["pageSize"];
	        this.orientation = source["orientation"];
	        this.fontFamily = source["fontFamily"];
	        this.fontSize = source["fontSize"];
	        this.marginTop = source["marginTop"];
	        this.marginBottom = source["marginBottom"];
	        this.marginLeft = source["marginLeft"];
	        this.marginRight = source["marginRight"];
	        this.childFriendly = source["childFriendly"];
	        this.footerEnabled = source["footerEnabled"];
	        this.footerText = source["footerText"];
	        this.customCSS = source["customCSS"];
	        this.unwrapFence = source["unwrapFence"];
	    }
	}

}


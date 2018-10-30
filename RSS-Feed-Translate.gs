/*****
**  USAGE
**  1. Go to https://script.google.com and copy this script's content into a new script;
**  2. Update "fromLang", "toLang", and "rssFeed" values with your data;
**  3. Go to "File" > "Manage Versions", and "Create New Version";
**  4. Go to "Publish" > "Deploy as Web App", then execute as "Me", who can access "Anyone, even Anonymous"
**       Validate changes with "Deploy";
**  >> You can now use the provided link to access the translated RSS feed.
******/

function doGet() {

  // What is the original language of the RSS Feed
  var fromLang = "fi";    
  
  // What is the destination language
  var toLang   = "en";    
  
  // Enter the full URL of the RSS feed
  var rssFeed  = "https://www.tivi.fi/rss.xml";  
  
  var feed = parseRSS(rssFeed, fromLang, toLang);
  return ContentService.createTextOutput(feed).setMimeType(ContentService.MimeType.RSS);    
}


function parseRSS(feed, fromLang, toLang) {
   
  var id = Utilities.base64Encode(feed + fromLang + toLang);
  var cacheMinute = 20;
  
  var cache = CacheService.getPublicCache();
  var rss   = cache.get(id);
  
  if (rss != null) {
    return rss;
  }
  
  var item, date, title, link, desc, guid, translateLink, description; 
  
  var txt = UrlFetchApp.fetch(feed).getContentText();
  var doc = Xml.parse(txt, false);  
  
  title = doc.getElement().getElement("channel").getElement("title").getText();
  description = doc.getElement().getElement("channel").getElement("description").getText();
  
  rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:blogChannel="http://backend.userland.com/blogChannelModule">\n';
  rss += "<channel>\n<title>";
  rss += LanguageApp.translate(title, fromLang, toLang);
  rss += " (" + title + ")</title>\n";
  
  rss += "<link>" + feed + "</link>\n";
  rss += "<description>";
  rss += LanguageApp.translate(description, fromLang, toLang);
  rss += "</description>\n";
  rss += "<language>" + fromLang + "-" + toLang + "</language>\n";
  rss += "<ttl>" + cacheMinute + "</ttl>\n";
    
  var items = doc.getElement().getElement("channel").getElements("item");   
  
  for (var i in items) {

    try {
      
      item  = items[i];
      
      title = item.getElement("title").getText();
      link  = item.getElement("link").getText();
      date  = item.getElement("pubDate").getText();
      desc  = item.getElement("description").getText();
      
      guid  = Utilities.base64Encode(link + fromLang + toLang);
          
      title = LanguageApp.translate(title, fromLang, toLang);
      desc  = LanguageApp.translate(desc,  fromLang, toLang, {contentType: "html"});
      
      translateLink = "https://translate.google.com/translate?sl=" + fromLang + "&amp;tl=" + toLang + "&amp;js=y&amp;prev=_t&amp;hl=" + toLang + "&amp;ie=UTF-8&amp;u=" + encodeURI( link );
      
      rss += "<item>\n";
      rss += "  <title>"   + title + "</title>\n";
      rss += "  <link>" + translateLink + "</link>\n";
      rss += "  <pubDate>" + date  + "</pubDate>\n";
      rss += "  <guid>"    + guid  + "</guid>\n";
      rss += "  <description><![CDATA[" + desc + "]]></description>\n";
      rss += "</item>\n";
      
    } catch (e) {
      Logger.log(e);
    }
  }
  
  rss += "</channel></rss>";
  
  cache.put(id, rss, cacheMinute*60);
  return rss;
  
}

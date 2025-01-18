import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private baseUrl = 'https://countriesnow.space/api/v0.1';

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/countries`);
  }

  getStates(country: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/countries/states`, { country });
  }

  getCities(country: string, state: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/countries/state/cities`, { country, state });
  }
}

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Profile } from '../model/profile';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Apiresponse } from '../apiresponse';
import { Router } from '@angular/router'; 

@Injectable({
  providedIn: 'root'
})
export class ProfileServiceService {

  constructor(private httpClient:HttpClient,private router:Router) { }
  private baseURL = 'http://localhost:8080/profiles';

  
  getProfilesList(): Observable<Profile[]> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<Apiresponse<Profile[]>>(`${this.baseURL}?page=0&size=100`,{headers}).pipe(
      map(response => {
        if (response.success) {
          return response.data.map(this.mapToProfile);
        } else {
          throw new Error(response.message);
        }
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  getListProfileByIdPendingJob(id:number[]): Observable<Profile[]> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<Apiresponse<Profile[]>>(`${this.baseURL}/batch?ids=${id}`, {headers}).pipe(
      map(response => {
        if (response.success) {
          return response.data.map(this.mapToProfile);
        } else {
          throw new Error(response.message);
        }
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  createProfile(profile: FormData):Observable<Profile> {
    const headers = this.createAuthorizationHeader();
    const image = profile.get('image') as File | null;
    return this.httpClient.post<Apiresponse<Profile>>(`${this.baseURL}/me`, this.formDataToProfilePayload(profile), { headers }).pipe(
      switchMap(response => {
        if (!response.success) {
          throw new Error(response.message);
        }
        if (image) {
          const avatarData = new FormData();
          avatarData.append('image', image);
          return this.httpClient.post<Apiresponse<Profile>>(`${this.baseURL}/me/avatar`, avatarData, { headers })
            .pipe(map(avatarResponse => this.mapWrappedProfile(avatarResponse)));
        }
        return of(this.mapToProfile(response.data));
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  updateProfile(profile: FormData): Observable<Profile> {
   
    const headers = this.createAuthorizationHeader();
    const image = profile.get('image') as File | null;
   
    return this.httpClient.patch<Apiresponse<Profile>>(`${this.baseURL}/me`, this.formDataToProfilePayload(profile), { headers }).pipe(
      switchMap(response => {
        if (response.success) {
          if (image) {
            const avatarData = new FormData();
            avatarData.append('image', image);
            return this.httpClient.post<Apiresponse<Profile>>(`${this.baseURL}/me/avatar`, avatarData, { headers })
              .pipe(map(avatarResponse => this.mapWrappedProfile(avatarResponse)));
          }
          return of(this.mapToProfile(response.data));
        }
        throw new Error(response.message);
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  getProfileByType(type: string): Observable<Profile[]> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<Apiresponse<Profile[]>>(`${this.baseURL}?type=${type}&page=0&size=100`, {headers}).pipe(
      map(response => {
        if (response.success) {
          return response.data.map(this.mapToProfile);
        } else {
          throw new Error(response.message);
        }
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  getProfileById(id:number):Observable<Profile>{
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<any>(`${this.baseURL}/${id}`, {headers})
   .pipe(map(response=>{
     if(response.success){
       return this.mapToProfile(response.data);
     }
     else{
       throw new Error(response.message);
     }
   }),
   catchError(
    error => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        console.error('Unauthorized:', error);
        this.router.navigate(['/login']);
        this.clearAuthState();
      }
      console.error('Error fetching profiles:', error);
      return throwError(() => new Error('Something went wrong!'));
    }
  )
  );
  }

  getProfileByUserId(userId:number): Observable<Profile>{
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<Apiresponse<Profile>>(`${this.baseURL}/by-user/${userId}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          return this.mapToProfile(response.data);
        } else {
          throw new Error(response.message);
        }
      }),
      catchError(
        error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            console.error('Unauthorized:', error);
            this.router.navigate(['/login']);
            this.clearAuthState();
          }
          console.error('Error fetching profiles:', error);
          return throwError(() => new Error('Something went wrong!'));
        }
      )
    );
  }

  getProfileByUser(userId: number): Observable<Profile> {
    return this.getProfileByUserId(userId);
  }

  private createAuthorizationHeader(): HttpHeaders {
    if (typeof localStorage === 'undefined') {
      return new HttpHeaders();
    }
    const token = localStorage.getItem('authToken');
    if(token){
      console.log('Token found in local store:', token);
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    else
    {
      console.log('Token not found in local store');
    }
    return new HttpHeaders();
  }

  private clearAuthState(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userCurrent');
  }

  private mapWrappedProfile(response: Apiresponse<Profile>): Profile {
    if (!response.success) {
      throw new Error(response.message);
    }
    return this.mapToProfile(response.data);
  }

  private formDataToProfilePayload(formData: FormData): any {
    const contact = {
      address: this.formValue(formData, 'contact.address'),
      phone: this.formValue(formData, 'contact.phone'),
      email: this.formValue(formData, 'contact.email')
    };
    return {
      title: this.formValue(formData, 'title'),
      objective: this.formValue(formData, 'objective'),
      education: this.formValue(formData, 'education'),
      workExperience: this.formValue(formData, 'workExperience'),
      skills: this.formValue(formData, 'skills'),
      typeProfile: this.formValue(formData, 'typeProfile'),
      contact
    };
  }

  private formValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);
    if (value === null || value instanceof File) {
      return null;
    }
    const text = value.toString().trim();
    return text.length > 0 ? text : null;
  }

  private mapToProfile(profileDTO: any): Profile {
    return {
      id: profileDTO.id,
      objective: profileDTO.objective,
      education: profileDTO.education,
      workExperience: profileDTO.workExperience,
      idUser:profileDTO.idUser,
      title: profileDTO.title,
      contact: profileDTO.contact,
      skills: profileDTO.skills,
      typeProfile: profileDTO.typeProfile,
      url: profileDTO.url
    };
  }
}
